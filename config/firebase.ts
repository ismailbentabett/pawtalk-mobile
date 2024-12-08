import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseSignUp,
  signOut as firebaseSignOut,
  updateProfile,
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { UserData } from "../types/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch(console.error);

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  userData?: UserData;
}

export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await firebaseSignIn(auth, email, password);
    const userData = await getCurrentUserData();

    if (userCredential.user && userData) {
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        { 
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp() 
        },
        { merge: true }
      );

      return {
        success: true,
        user: userCredential.user,
        userData,
      };
    }

    throw new Error("Failed to get user data");
  } catch (error: any) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await firebaseSignUp(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const userData: UserData = {
      uid: user.uid,
      email: user.email || "",
      displayName: displayName,
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

    return { success: true, user, userData };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: getAuthErrorMessage(error.code),
    };
  }
};

export const signOut = async (): Promise<AuthResponse> => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return {
      success: false,
      error: "Failed to sign out",
    };
  }
};

export const getCurrentUserData = async (): Promise<UserData | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        uid: user.uid,
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
};

const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "Email already in use";
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/network-request-failed":
      return "Network error occurred. Please check your connection";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/user-disabled":
      return "This account has been disabled";
    default:
      return "An error occurred during authentication";
  }
};