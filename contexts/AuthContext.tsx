// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, getCurrentUserData } from '../config/firebase';
import type { UserData } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  isAuthorized: (requiredRoles?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
  isAuthorized: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (user) {
      const data = await getCurrentUserData();
      setUserData(data);
    } else {
      setUserData(null);
    }
  };

  const isAuthorized = (requiredRoles?: string[]): boolean => {
    if (!user || !userData) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(userData.role);
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setUser(user);
      if (user) {
        await refreshUserData();
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    userData,
    loading,
    refreshUserData,
    isAuthorized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};