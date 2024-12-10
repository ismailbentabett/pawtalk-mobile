import { Timestamp } from 'firebase/firestore';

export type ConversationStatus = 'active' | 'archived';
export type MessageType = 'text' | 'image';

export interface Conversation {
  id: string;
  participants: string[];
  petId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  status: ConversationStatus;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
  type: MessageType;
  conversationId?: string; // Added to link message to conversation
}