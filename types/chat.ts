import { Timestamp } from "firebase/firestore";

export type ConversationStatus = "active" | "archived";
export type MessageType = "text" | "image" | "gif";
export type EmojiCategory =
  | "smileys"
  | "animals"
  | "foods"
  | "activities"
  | "objects"
  | "symbols";

export interface Conversation {
  id: string;
  participants: string[];
  petId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  status: ConversationStatus;
  lastMessage?: {
    content: string;
    timestamp: Timestamp;
    type: MessageType;
  };
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  conversationId: string;
  createdAt: Date;
  type: MessageType;
  read: boolean;
  gifUrl?: string;
}

export interface ChatDisplay {
  id: string;
  petId: string;
  petName: string;
  petAvatar: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    type: MessageType;
  };
  unread: number;
}

export interface PetMatch {
  id: string;
  name: string;
  avatar: string;
  lastActive?: Date;
  bio?: string;
}

export interface PetDetails {
  name: string;
  avatar: string;
  bio?: string;
}

export interface GiphyGif {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
  title: string;
}