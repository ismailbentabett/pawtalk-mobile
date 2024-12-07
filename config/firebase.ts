import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { UserData } from '../types/auth';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



export const createUserWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userCredential = await firebaseCreateUser(auth, email, password);

    const userData: UserData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName,
      role: 'user',
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    return { success: true };
  } catch (error: any) {
    let message = 'Registration failed';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Email already in use';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/weak-password':
        message = 'Password must be at least 6 characters';
        break;
    }
    return { success: false, error: message };
  }
};

export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await firebaseSignIn(auth, email, password);
    return { success: true };
  } catch (error: any) {
    let message = 'Login failed';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Try again later';
        break;
    }
    return { success: false, error: message };
  }
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUserData = async (): Promise<UserData | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  return userDoc.data() as UserData;
};

// Auth state observer
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db };