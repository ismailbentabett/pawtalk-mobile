import { Pet } from "../types/Pet";
import { Match } from "../types/Match";
import { Message } from "../types/Message";
import { Conversation, ConversationStatus } from "../types/Conversation";
import { db, auth } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";

export class PetService {
  static async fetchPets(): Promise<Pet[]> {
    try {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const matchedPetIds = await this.getMatchedPetIds(userId);
      const petsQuery = this.createPetsQuery(matchedPetIds);
      const querySnapshot = await getDocs(petsQuery);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Pet[];
    } catch (error) {
      console.error("Error fetching pets:", error);
      throw error;
    }
  }

  static async createMatch(
    petId: string
  ): Promise<{ match: Match; conversationId: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      throw new Error("User not authenticated");
    }

    try {
      const existingMatch = await this.findExistingMatch(
        currentUser.uid,
        petId
      );
      if (existingMatch) return existingMatch;

      const match = this.createMatchObject(currentUser.uid, petId);
      const pet = await this.getPetById(petId);
      if (!pet) throw new Error("Pet not found");

      const conversationId = await this.createConversation(
        currentUser.uid,
        pet
      );

      await this.saveMatchAndUpdateRelatedDocs(match, currentUser.uid, petId);

      return { match, conversationId };
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  }

  static async getPetById(petId: string): Promise<Pet | null> {
    const petDoc = await getDoc(doc(db, "pets", petId));
    return petDoc.exists()
      ? ({ id: petDoc.id, ...petDoc.data() } as Pet)
      : null;
  }

  private static async getMatchedPetIds(userId: string): Promise<string[]> {
    const matchesQuery = query(
      collection(db, "matches"),
      where("userId", "==", userId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);
    return matchesSnapshot.docs.map((doc) => doc.data().petId);
  }

  private static createPetsQuery(matchedPetIds: string[]) {
    return matchedPetIds.length > 0
      ? query(
          collection(db, "pets"),
          where("status", "==", "available"),
          where("id", "not-in", matchedPetIds),
          limit(10)
        )
      : query(
          collection(db, "pets"),
          where("status", "==", "available"),
          limit(10)
        );
  }

  private static async findExistingMatch(
    userId: string,
    petId: string
  ): Promise<{ match: Match; conversationId: string } | null> {
    const existingMatchQuery = query(
      collection(db, "matches"),
      where("userId", "==", userId),
      where("petId", "==", petId)
    );
    const existingMatchSnapshot = await getDocs(existingMatchQuery);

    if (!existingMatchSnapshot.empty) {
      const existingMatch = existingMatchSnapshot.docs[0].data() as Match;
      const existingConversationId = await this.findExistingConversationId(
        userId,
        petId
      );
      return { match: existingMatch, conversationId: existingConversationId };
    }

    return null;
  }

  private static async findExistingConversationId(
    userId: string,
    petId: string
  ): Promise<string> {
    const existingConversationQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      where("petId", "==", petId)
    );
    const existingConversationSnapshot = await getDocs(
      existingConversationQuery
    );

    if (existingConversationSnapshot.empty) {
      throw new Error("Existing match found but no conversation exists");
    }

    return existingConversationSnapshot.docs[0].id;
  }

  private static createMatchObject(userId: string, petId: string): Match {
    return {
      id: doc(collection(db, "matches")).id,
      userId,
      petId,
      status: "matched",
      createdAt: serverTimestamp() as Timestamp,
      matchedAt: serverTimestamp() as Timestamp,
    };
  }

  private static async createConversation(
    userId: string,
    pet: Pet
  ): Promise<string> {
    const conversationRef = doc(collection(db, "conversations"));
    const conversation: Conversation = {
      id: conversationRef.id,
      participants: [userId, pet.id],
      petId: pet.id,
      createdAt: serverTimestamp() as Timestamp,
      lastMessageAt: serverTimestamp() as Timestamp,
      status: "active" as ConversationStatus,
      userId: userId,
    };

    await setDoc(conversationRef, conversation);
    await this.createInitialMessage(conversationRef.id, pet.id, pet.name);
    return conversationRef.id;
  }

  private static async createInitialMessage(
    conversationId: string,
    petId: string,
    petName: string
  ): Promise<void> {
    const messageRef = doc(collection(db, "messages"));
    const message: Message = {
      id: messageRef.id,
      senderId: petId,
      content: `Woof! I'm ${petName}! Thanks for matching with me! 🐾`,
      createdAt: serverTimestamp() as Timestamp,
      read: false,
      type: "text",
      conversationId,
    };

    await setDoc(messageRef, message);
  }

  private static async saveMatchAndUpdateRelatedDocs(
    match: Match,
    userId: string,
    petId: string
  ): Promise<void> {
    await Promise.all([
      setDoc(doc(db, "matches", match.id), match),
      updateDoc(doc(db, "pets", petId), {
        matches: arrayUnion(userId),
        matchRate: increment(0.1),
        lastActivity: serverTimestamp(),
      }),
      updateDoc(doc(db, "users", userId), {
        "settings.lastMatch": serverTimestamp(),
      }),
    ]);
  }
}
