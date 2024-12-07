export type UserRole = 'user' | 'moderator' | 'admin';
  
export interface UserData {
  uid: string;
  email: string | null;
  displayName?: string;
  role: UserRole;
  createdAt: number;
}