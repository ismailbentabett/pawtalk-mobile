import { useEffect, useState, useCallback, useRef } from "react";
import { ChatDisplay, Message, MessageType } from "../types/chat";
import ChatService from "../services/ChatService";
import { useAuth } from "./useAuth";

export function useChat() {
  const { user, userData, isLoggedIn } = useAuth();
  const [conversations, setConversations] = useState<ChatDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversationsUnsubscribeRef = useRef<(() => void) | null>(null);
  const messageUnsubscribesRef = useRef<Map<string, () => void>>(new Map());
  const typingUnsubscribesRef = useRef<Map<string, () => void>>(new Map());

  const subscribeToConversations = useCallback(() => {
    if (!isLoggedIn || !user) {
      setError("No authenticated user found");
      setLoading(false);
      return null;
    }

    try {
      const unsubscribe = ChatService.subscribeToConversations(
        user.uid,
        (conversationsData) => {
          setConversations(conversationsData);
          setError(null);
          setLoading(false);
        },
        (error) => {
          console.error("Error in conversations subscription:", error);
          setError("Failed to load conversations");
          setLoading(false);
        }
      );

      conversationsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up conversations subscription:", error);
      setError("Failed to subscribe to conversations");
      setLoading(false);
      return null;
    }
  }, [isLoggedIn, user]);

  const subscribeToMessages = useCallback(
    (conversationId: string, onUpdate: (messages: Message[]) => void) => {
      if (!isLoggedIn || !user) return null;

      try {
        const unsubscribe = ChatService.subscribeToMessages(
          conversationId,
          onUpdate,
          (error) => {
            console.error("Error in messages subscription:", error);
          }
        );

        messageUnsubscribesRef.current.set(conversationId, unsubscribe);
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up messages subscription:", error);
        return null;
      }
    },
    [isLoggedIn, user]
  );

  const subscribeToTyping = useCallback(
    (
      conversationId: string,
      onUpdate: (typingUsers: Record<string, boolean>) => void
    ) => {
      if (!isLoggedIn || !user) return null;

      try {
        const unsubscribe = ChatService.subscribeToTypingStatus(
          conversationId,
          onUpdate,
          (error) => {
            console.error("Error in typing subscription:", error);
          }
        );

        typingUnsubscribesRef.current.set(conversationId, unsubscribe);
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up typing subscription:", error);
        return null;
      }
    },
    [isLoggedIn, user]
  );

  const unsubscribeFromMessages = useCallback((conversationId: string) => {
    const unsubscribe = messageUnsubscribesRef.current.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      messageUnsubscribesRef.current.delete(conversationId);
    }
  }, []);

  const unsubscribeFromTyping = useCallback((conversationId: string) => {
    const unsubscribe = typingUnsubscribesRef.current.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      typingUnsubscribesRef.current.delete(conversationId);
    }
  }, []);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      type: MessageType = "text",
      gifUrl?: string
    ) => {
      if (!isLoggedIn || !user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        await ChatService.sendMessage(conversationId, content, type, gifUrl);
        return { success: true };
      } catch (error: any) {
        console.error("Error sending message:", error);
        return { success: false, error: error.message };
      }
    },
    [isLoggedIn, user]
  );

  const uploadImage = useCallback(
    async (uri: string): Promise<string> => {
      if (!isLoggedIn || !user) {
        throw new Error("User not authenticated");
      }

      try {
        return await ChatService.uploadImage(uri);
      } catch (error: any) {
        console.error("Error uploading image:", error);
        throw error;
      }
    },
    [isLoggedIn, user]
  );

  const markMessageAsRead = useCallback(
    async (messageId: string): Promise<void> => {
      if (!isLoggedIn || !user) {
        throw new Error("User not authenticated");
      }

      try {
        await ChatService.markMessageAsRead(messageId);
      } catch (error: any) {
        console.error("Error marking message as read:", error);
        throw error;
      }
    },
    [isLoggedIn, user]
  );

  const updateTypingStatus = useCallback(
    async (
      conversationId: string,
      userId: string,
      isTyping: boolean
    ): Promise<void> => {
      if (!isLoggedIn || !user) {
        throw new Error("User not authenticated");
      }

      try {
        await ChatService.updateTypingStatus(conversationId, userId, isTyping);
      } catch (error: any) {
        console.error("Error updating typing status:", error);
        throw error;
      }
    },
    [isLoggedIn, user]
  );

  useEffect(() => {
    if (isLoggedIn && user) {
      subscribeToConversations();
    }
    setInitializing(false);

    return () => {
      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
        conversationsUnsubscribeRef.current = null;
      }

      messageUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());
      typingUnsubscribesRef.current.forEach((unsubscribe) => unsubscribe());

      messageUnsubscribesRef.current.clear();
      typingUnsubscribesRef.current.clear();
    };
  }, [isLoggedIn, user, subscribeToConversations]);

  return {
    user,
    userData,
    isLoggedIn,
    conversations,
    loading,
    initializing,
    error,
    sendMessage,
    uploadImage,
    markMessageAsRead,
    updateTypingStatus,
    subscribeToMessages,
    subscribeToTyping,
    unsubscribeFromMessages,
    unsubscribeFromTyping,
  };
}
