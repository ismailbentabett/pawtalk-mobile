import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "moderator" | "user";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  profileImage?: string;
  settings: {
    notifications: boolean;
    emailPreferences: {
      matches: boolean;
      messages: boolean;
    };
  };
}