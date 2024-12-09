import { Timestamp } from 'firebase/firestore';

export type MessageType = 'text' | 'image';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
  type: MessageType;
}