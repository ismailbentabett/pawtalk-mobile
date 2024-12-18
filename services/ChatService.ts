import { auth, db } from '../config/firebase';
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
  Timestamp,
} from 'firebase/firestore';
import {
  Conversation,
  Message,
  ChatDisplay,
  PetDetails,
  ConversationStatus,
  MessageType,
} from '../types/chat';

const CLOUDINARY_URL = process.env.EXPO_CLOUDINARY_URL;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_CLOUDINARY_CLOUD_NAME;

class ChatService {
  private static instance: ChatService;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async getConversations(userId: string): Promise<ChatDisplay[]> {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      where('status', '==', 'active' as ConversationStatus),
      orderBy('lastMessageAt', 'desc')
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
                  petName: petDetails?.name || 'Unknown',
                  petAvatar: petDetails?.avatar || '/placeholder.png',
                  lastMessage: {
                    content: data.lastMessage?.content || '',
                    timestamp: data.lastMessage?.timestamp.toDate() || new Date(),
                    type: data.lastMessage?.type || 'text',
                  },
                  unread: await this.calculateUnreadMessages(doc.id, userId),
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

  async fetchPetDetails(petId: string): Promise<PetDetails | null> {
    try {
      const petDoc = await getDoc(doc(db, 'pets', petId));
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
      console.error('Error fetching pet details:', error);
      return null;
    }
  }

  async calculateUnreadMessages(conversationId: string, userId: string): Promise<number> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(messagesQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error calculating unread messages:', error);
      return 0;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
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

  async sendMessage(
    conversationId: string,
    content: string,
    type: MessageType = 'text',
    gifUrl?: string
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const messageData: Partial<Message> = {
      content,
      conversationId,
      senderId: currentUser.uid,
      createdAt: new Date(),
      type,
      read: false,
    };

    if (type === 'gif' && gifUrl) {
      messageData.gifUrl = gifUrl;
    }

    try {
      await addDoc(collection(db, 'messages'), messageData);
      await this.updateConversationTimestamp(conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
      throw error;
    }
  }

  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.secure_url;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`typing.${userId}`]: isTyping,
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
      throw error;
    }
  }
}

export default ChatService.getInstance();

