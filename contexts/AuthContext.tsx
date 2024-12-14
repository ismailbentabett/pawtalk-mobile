import React, { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import { User } from "firebase/auth";
import { UserData } from "../types/auth";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  initializing: boolean;
  isLoggedIn: boolean;
  refreshUserData: (uid: string) => Promise<void>;
  isAuthorized: (requiredRoles?: string[]) => boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};