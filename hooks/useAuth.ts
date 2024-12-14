import { User } from "firebase/auth";
import { useEffect, useState, useCallback } from "react";
import { auth } from "../config/firebase";
import { UserData } from "../types/auth";
import { AuthService } from "../services/AuthService";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const refreshUserData = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const data = await AuthService.getUserData(uid);
      if (data) {
        setUserData(data);
        await AuthService.persistUserData(data);
      } else {
        await AuthService.clearAuthState();
        setUserData(null);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      await AuthService.clearAuthState();
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userData = await AuthService.signIn(email, password);
      setUserData(userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        const userData = await AuthService.signUp(email, password, displayName);
        setUserData(userData);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await AuthService.signOut();
      setUserData(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const isAuthorized = useCallback(
    (requiredRoles?: string[]): boolean => {
      if (!user || !userData) return false;
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.includes(userData.role);
    },
    [user, userData]
  );

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const persistedUserData = await AuthService.getPersistedUserData();
        if (persistedUserData) {
          setUserData(persistedUserData);
        }
      } catch (error) {
        console.error("Error loading persisted auth data:", error);
        await AuthService.clearAuthState();
      }
    };

    loadPersistedData();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        await refreshUserData(authUser.uid);
      } else {
        await AuthService.clearAuthState();
        setUserData(null);
      }

      setInitializing(false);
      setLoading(false);
    });

    return unsubscribe;
  }, [refreshUserData]);

  return {
    user,
    userData,
    loading,
    initializing,
    isLoggedIn: !!user && !!userData,
    refreshUserData,
    isAuthorized,
    signIn,
    signUp,
    signOut,
  };
}
