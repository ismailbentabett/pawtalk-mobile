import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  WriteBatch,
  writeBatch
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import {
  ChatDisplay,
  Conversation,
  ConversationStatus,
  Message,
  MessageType,
  PetDetails,
} from "../types/chat";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
  url: string;
}

const cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.EXPO_CLOUDINARY_CLOUD_NAME || "",
  apiKey: process.env.EXPO_CLOUDINARY_API_KEY || "",
  apiSecret: process.env.EXPO_CLOUDINARY_API_SECRET || "",
  uploadPreset: process.env.EXPO_CLOUDINARY_UPLOAD_PRESET || "",
  url: process.env.EXPO_CLOUDINARY_URL || "",
};

class ChatService {
  private static instance: ChatService;
  private messageListeners: Map<string, () => void>;
  private conversationListeners: Map<string, () => void>;
  private typingListeners: Map<string, () => void>;

  private constructor() {
    this.messageListeners = new Map();
    this.conversationListeners = new Map();
    this.typingListeners = new Map();
    this.validateConfig();
  }

  private validateConfig() {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      console.error("Missing required Cloudinary configuration");
    }
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async getConversations(userId: string): Promise<ChatDisplay[]> {
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      where("status", "==", "active" as ConversationStatus),
      orderBy("lastMessageAt", "desc")
    );

    return new Promise((resolve, reject) => {
      onSnapshot(
        conversationsQuery,
        async (snapshot) => {
          try {
            const conversationsData: ChatDisplay[] = await Promise.all(
              snapshot.docs.map(async (doc) => {
                const data = doc.data() as Conversation;
                const petDetails = await this.fetchPetDetails(data.petId);
                return {
                  id: doc.id,
                  petId: data.petId,
                  petName: petDetails?.name || "Unknown",
                  petAvatar: petDetails?.images.main || "/placeholder.png",
                  lastMessage: {
                    content: data.lastMessage?.content || "",
                    timestamp:
                      data.lastMessage?.timestamp.toDate() || new Date(),
                    type: data.lastMessage?.type || "text",
                  },
                  unread: await this.calculateUnreadMessages(doc.id, userId),
                  typing: data.typing || {},
                };
              })
            );
            resolve(conversationsData);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  subscribeToConversations(
    userId: string,
    onUpdate: (conversations: ChatDisplay[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      where("status", "==", "active" as ConversationStatus),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        try {
          const conversationsData: ChatDisplay[] = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data() as Conversation;
              const petDetails = await this.fetchPetDetails(data.petId);
              const unreadCount = await this.calculateUnreadMessages(
                doc.id,
                userId
              );
              return {
                id: doc.id,
                petId: data.petId,
                petName: petDetails?.name || "Unknown",
                petAvatar: petDetails?.images.main || "/placeholder.png",
                lastMessage: {
                  content: data.lastMessage?.content || "",
                  timestamp: data.lastMessage?.timestamp.toDate() || new Date(),
                  type: data.lastMessage?.type || "text",
                },
                unread: unreadCount,
                typing: data.typing || {},
              };
            })
          );
          onUpdate(conversationsData);
        } catch (error) {
          onError(error as Error);
        }
      },
      (error) => onError(error)
    );

    this.conversationListeners.set(userId, unsubscribe);
    return unsubscribe;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return new Promise((resolve, reject) => {
      onSnapshot(
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
          reject(error);
        }
      );
    });
  }

  subscribeToMessages(
    conversationId: string,
    onUpdate: (messages: Message[]) => void,
    onError: (error: Error) => void
  ): () => void {
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
      (error) => onError(error)
    );

    this.messageListeners.set(conversationId, unsubscribe);
    return unsubscribe;
  }

  subscribeToTypingStatus(
    conversationId: string,
    onUpdate: (typingUsers: Record<string, boolean>) => void,
    onError: (error: Error) => void
  ): () => void {
    const conversationRef = doc(db, "conversations", conversationId);

    const unsubscribe = onSnapshot(
      conversationRef,
      (snapshot) => {
        const data = snapshot.data();
        onUpdate(data?.typing || {});
      },
      (error) => onError(error)
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
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");

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

    const batch: WriteBatch = writeBatch(db);

    try {
      const messageRef = doc(collection(db, "messages"));
      batch.set(messageRef, messageData);

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
    try {
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        throw new Error("Cloudinary configuration is missing");
      }

      const formData = new FormData();
      const filename = uri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);

      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      formData.append("cloud_name", cloudinaryConfig.cloudName);
      formData.append("api_key", cloudinaryConfig.apiKey);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
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
