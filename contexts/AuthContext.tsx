import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, getCurrentUserData, signOut as firebaseSignOut } from '../config/firebase';
import { UserData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  initializing: boolean;
  isLoggedIn: boolean;
  refreshUserData: () => Promise<void>;
  isAuthorized: (requiredRoles?: string[]) => boolean;
  signOut: () => Promise<{ success: boolean; error?: string }>;
}

const STORAGE_KEYS = {
  USER_DATA: '@auth_user_data',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  initializing: true,
  isLoggedIn: false,
  refreshUserData: async () => {},
  isAuthorized: () => false,
  signOut: async () => ({ success: false }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const refreshUserData = useCallback(async () => {
    if (!user) {
      setUserData(null);
      return;
    }

    try {
      setLoading(true);
      const data = await getCurrentUserData();
      if (data) {
        setUserData(data);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
      } else {
        await clearAuthState();
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      await clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearAuthState = async () => {
    setUserData(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  };

  const isAuthorized = useCallback((requiredRoles?: string[]): boolean => {
    if (!user || !userData) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(userData.role);
  }, [user, userData]);

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await firebaseSignOut();
      await clearAuthState();
      return { success: true };
    } catch (error: any) {
      console.error('Error during sign out:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const persistedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (persistedUserData) {
          setUserData(JSON.parse(persistedUserData));
        }
      } catch (error) {
        console.error('Error loading persisted auth data:', error);
        await clearAuthState();
      }
    };

    loadPersistedData();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        await refreshUserData();
      } else {
        await clearAuthState();
      }
      
      setInitializing(false);
      setLoading(false);
    });

    return unsubscribe;
  }, [refreshUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        initializing,
        isLoggedIn: !!user && !!userData,
        refreshUserData,
        isAuthorized,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};