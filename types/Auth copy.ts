// types/auth.ts
export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  createdAt: Date;
}

// constants/routes.ts
export const PUBLIC_ROUTES = {
  LOGIN: '/login'
} as const;

export const ROLE_REQUIREMENTS: Record<string, UserRole[]> = {
  '/protected': ['moderator', 'admin'],
  '/admin': ['admin'],
};