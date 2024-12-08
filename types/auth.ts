export type UserRole = 'user' | 'moderator' | 'admin';
  
// types/auth.ts
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}
export interface AuthError {
  code: string;
  message: string;
}