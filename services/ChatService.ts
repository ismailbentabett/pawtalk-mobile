import { auth, db } from "../config/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
  limit,
  WriteBatch,
  writeBatch,
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import {
  Conversation,
  Message,
  ChatDisplay,
  PetDetails,
  ConversationStatus,
  MessageType,
} from "../types/chat";

class ChatService {
  private static instance: ChatService;
  private messageListeners: Map<string, () => void>;
  private conversationListeners: Map<string, () => void>;
  private typingListeners: Map<string, () => void>;

  private constructor() {
    this.messageListeners = new Map();
    this.conversationListeners = new Map();
    this.typingListeners = new Map();
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private async processConversationDoc(
    doc: DocumentSnapshot<DocumentData>,
    userId: string
  ): Promise<ChatDisplay> {
    try {
      const data = doc.data() as Conversation;
      const petDetails = await this.fetchPetDetails(data.petId);
      const unreadCount = await this.calculateUnreadMessages(doc.id, userId);

      return {
        id: doc.id,
        petId: data.petId,
        petName: petDetails?.name || "Unknown",
        petAvatar: petDetails?.images.main || "/placeholder.png",
        lastMessage: {
          content: data.lastMessage?.content || "",
          timestamp: data.lastMessage?.timestamp?.toDate() || new Date(),
          type: data.lastMessage?.type || "text",
        },
        unread: unreadCount,
        typing: data.typing || {},
      };
    } catch (error) {
      console.error("Error processing conversation doc:", error);
      throw error;
    }
  }

  async getConversations(userId: string): Promise<ChatDisplay[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      where("status", "==", "active" as ConversationStatus),
      orderBy("lastMessageAt", "desc")
    );

    return new Promise((resolve, reject) => {
      try {
        const unsubscribe = onSnapshot(
          conversationsQuery,
          async (snapshot: QuerySnapshot) => {
            try {
              const conversationsData = await Promise.all(
                snapshot.docs.map((doc) =>
                  this.processConversationDoc(doc, userId)
                )
              );
              resolve(conversationsData);
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            console.error("Error in getConversations:", error);
            reject(error);
          }
        );

        // Store the unsubscribe function
        this.conversationListeners.set(userId, unsubscribe);
      } catch (error) {
        console.error("Error setting up conversations listener:", error);
        reject(error);
      }
    });
  }

  subscribeToConversations(
    userId: string,
    onUpdate: (conversations: ChatDisplay[]) => void,
    onError: (error: Error) => void
  ): () => void {
    if (!userId) {
      onError(new Error("User ID is required"));
      return () => {};
    }

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      where("status", "==", "active" as ConversationStatus),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot: QuerySnapshot) => {
        try {
          const conversationsData = await Promise.all(
            snapshot.docs.map((doc) => this.processConversationDoc(doc, userId))
          );
          onUpdate(conversationsData);
        } catch (error) {
          console.error("Error in conversation subscription:", error);
          onError(error as Error);
        }
      },
      (error) => {
        console.error("Conversation subscription error:", error);
        onError(error);
      }
    );

    this.conversationListeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return new Promise((resolve, reject) => {
      try {
        const unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const messages = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Message[];
            resolve(messages);
          },
          (error) => {
            console.error("Error in getMessages:", error);
            reject(error);
          }
        );

        this.messageListeners.set(conversationId, unsubscribe);
      } catch (error) {
        console.error("Error setting up messages listener:", error);
        reject(error);
      }
    });
  }

  subscribeToMessages(
    conversationId: string,
    onUpdate: (messages: Message[]) => void,
    onError: (error: Error) => void
  ): () => void {
    if (!conversationId) {
      onError(new Error("Conversation ID is required"));
      return () => {};
    }

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Message[];
        onUpdate(messages);
      },
      (error) => {
        console.error("Message subscription error:", error);
        onError(error);
      }
    );

    this.messageListeners.set(conversationId, unsubscribe);
    return unsubscribe;
  }

  subscribeToTypingStatus(
    conversationId: string,
    onUpdate: (typingUsers: Record<string, boolean>) => void,
    onError: (error: Error) => void
  ): () => void {
    if (!conversationId) {
      onError(new Error("Conversation ID is required"));
      return () => {};
    }

    const conversationRef = doc(db, "conversations", conversationId);

    const unsubscribe = onSnapshot(
      conversationRef,
      (snapshot) => {
        const data = snapshot.data();
        onUpdate(data?.typing || {});
      },
      (error) => {
        console.error("Typing status subscription error:", error);
        onError(error);
      }
    );

    this.typingListeners.set(conversationId, unsubscribe);
    return unsubscribe;
  }

  async sendMessage(
    conversationId: string,
    content: string,
    type: MessageType = "text",
    gifUrl?: string
  ): Promise<void> {
    if (!conversationId || !content) {
      throw new Error("Conversation ID and content are required");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const batch: WriteBatch = writeBatch(db);

    try {
      // Create message data
      const messageData: Partial<Message> = {
        content,
        conversationId,
        senderId: currentUser.uid,
        createdAt: new Date(),
        type,
        read: false,
      };

      if (type === "gif" && gifUrl) {
        messageData.gifUrl = gifUrl;
      }

      // Add new message
      const messageRef = doc(collection(db, "messages"));
      batch.set(messageRef, messageData);

      // Update conversation
      const conversationRef = doc(db, "conversations", conversationId);
      batch.update(conversationRef, {
        lastMessage: {
          content,
          timestamp: serverTimestamp(),
          type,
        },
        lastMessageAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async uploadImage(uri: string): Promise<string> {
    if (!uri) {
      throw new Error("Image URI is required");
    }

    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);

      formData.append(
        "upload_preset",
        process.env.EXPO_CLOUDINARY_UPLOAD_PRESET
      );
      formData.append("cloud_name", process.env.EXPO_CLOUDINARY_CLOUD_NAME);
      formData.append("api_key", process.env.EXPO_CLOUDINARY_API_KEY);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.EXPO_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message ||
            `Upload failed with status ${response.status}`
        );
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to upload image");
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    if (!messageId) {
      throw new Error("Message ID is required");
    }

    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, { read: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }

  async updateTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    if (!conversationId || !userId) {
      throw new Error("Conversation ID and user ID are required");
    }

    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        [`typing.${userId}`]: isTyping,
      });
    } catch (error) {
      console.error("Error updating typing status:", error);
      throw error;
    }
  }

  async fetchPetDetails(petId: string): Promise<PetDetails | null> {
    if (!petId) {
      throw new Error("Pet ID is required");
    }

    try {
      const petDoc = await getDoc(doc(db, "pets", petId));
      if (petDoc.exists()) {
        const data = petDoc.data() as PetDetails;
        return {
          name: data.name,
          avatar: data.avatar,
          bio: data.bio,
          images: data.images,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching pet details:", error);
      return null;
    }
  }

  async calculateUnreadMessages(
    conversationId: string,
    userId: string
  ): Promise<number> {
    if (!conversationId || !userId) {
      throw new Error("Conversation ID and user ID are required");
    }

    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("senderId", "!=", userId),
        where("read", "==", false)
      );
      const snapshot = await getDocs(messagesQuery);
      return snapshot.size;
    } catch (error) {
      console.error("Error calculating unread messages:", error);
      return 0;
    }
  }

  unsubscribeAll(): void {
    this.messageListeners.forEach((unsubscribe) => unsubscribe());
    this.conversationListeners.forEach((unsubscribe) => unsubscribe());
    this.typingListeners.forEach((unsubscribe) => unsubscribe());

    this.messageListeners.clear();
    this.conversationListeners.clear();
    this.typingListeners.clear();
  }

  unsubscribeFromMessages(conversationId: string): void {
    const unsubscribe = this.messageListeners.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.messageListeners.delete(conversationId);
    }
  }

  unsubscribeFromConversations(userId: string): void {
    const unsubscribe = this.conversationListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.conversationListeners.delete(userId);
    }
  }

  unsubscribeFromTyping(conversationId: string): void {
    const unsubscribe = this.typingListeners.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.typingListeners.delete(conversationId);
    }
  }
}

export default ChatService.getInstance();
