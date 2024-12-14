import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";



import { STORAGE_KEYS } from "../constants/auth";
import { AuthError, UserData } from "../types/auth";
import { formatTimestamp, getAuthErrorMessage } from "../utils/auth";

export class AuthService {
  static async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserData> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userData: UserData = {
        uid: user.uid,
        email: user.email || "",
        displayName,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      await this.persistUserData(userData);
      return userData;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  static async signIn(email: string, password: string): Promise<UserData> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userData = await this.getUserData(userCredential.user.uid);

      if (!userData) {
        throw new Error("User data not found");
      }

      await this.updateUserLoginTime(userCredential.user.uid);
      await this.persistUserData(userData);

      return userData;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await this.clearAuthState();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  static async getUserData(uid: string): Promise<UserData | null> {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          uid,
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
          lastLoginAt: formatTimestamp(data.lastLoginAt),
        } as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  private static async updateUserLoginTime(uid: string): Promise<void> {
    try {
      await setDoc(
        doc(db, "users", uid),
        { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating user login time:", error);
    }
  }

  static async persistUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
    } catch (error) {
      console.error("Error persisting user data:", error);
    }
  }

  static async getPersistedUserData(): Promise<UserData | null> {
    try {
      const persistedUserData = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_DATA
      );
      return persistedUserData ? JSON.parse(persistedUserData) : null;
    } catch (error) {
      console.error("Error getting persisted user data:", error);
      return null;
    }
  }

  static async clearAuthState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Error clearing auth state:", error);
    }
  }

  private static handleAuthError(error: any): AuthError {
    console.error("Auth error:", error);
    return {
      code: error.code || "unknown",
      message: getAuthErrorMessage(error.code),
    };
  }
}
