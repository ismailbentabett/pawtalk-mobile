import { Timestamp } from "firebase/firestore";

export const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

export const getAuthErrorMessage = (errorCode: string): string => {
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