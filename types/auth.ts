import { User } from "firebase/auth";

export type UserRole = "user" | "moderator" | "admin";

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  userData?: UserData;
}