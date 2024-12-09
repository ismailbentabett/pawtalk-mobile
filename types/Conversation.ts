import { Timestamp } from 'firebase/firestore';

export type ConversationStatus = 'active' | 'archived';

export interface Conversation {
  id: string;
  participants: string[];
  petId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  status: ConversationStatus;
}