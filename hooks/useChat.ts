import { useEffect, useState, useCallback } from "react";
import { ChatDisplay, Message, MessageType } from "../types/chat";
import ChatService from "../services/ChatService";
import { useAuth } from "./useAuth";

export function useChat() {
  const { user, userData, isLoggedIn } = useAuth();
  const [conversations, setConversations] = useState<ChatDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setError('No authenticated user found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const conversationsData = await ChatService.getConversations(user.uid);
      setConversations(conversationsData);
      setError(null);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      setError('Failed to refresh conversations');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    type: MessageType = 'text',
    gifUrl?: string
  ) => {
    if (!isLoggedIn || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      await ChatService.sendMessage(conversationId, content, type, gifUrl);
      await refreshConversations();
      return { success: true };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }, [isLoggedIn, user, refreshConversations]);

  const getMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    if (!isLoggedIn || !user) {
      throw new Error('User not authenticated');
    }

    try {
      return await ChatService.getMessages(conversationId);
    } catch (error: any) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }, [isLoggedIn, user]);

  const uploadImage = useCallback(async (uri: string): Promise<string> => {
    if (!isLoggedIn || !user) {
      throw new Error('User not authenticated');
    }

    try {
      return await ChatService.uploadImage(uri);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, [isLoggedIn, user]);

  const markMessageAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (!isLoggedIn || !user) {
      throw new Error('User not authenticated');
    }

    try {
      await ChatService.markMessageAsRead(messageId);
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }, [isLoggedIn, user]);

  const updateTypingStatus = useCallback(async (
    conversationId: string,
    isTyping: boolean
  ): Promise<void> => {
    if (!isLoggedIn || !user) {
      throw new Error('User not authenticated');
    }

    try {
      await ChatService.updateTypingStatus(conversationId, user.uid, isTyping);
    } catch (error: any) {
      console.error('Error updating typing status:', error);
      throw error;
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const initializeChat = async () => {
      if (isLoggedIn && user) {
        await refreshConversations();
      }
      setInitializing(false);
    };

    initializeChat();
  }, [isLoggedIn, user, refreshConversations]);

  useEffect(() => {
    if (isLoggedIn && user) {
      refreshConversations();
    } else {
      setConversations([]);
    }
    setLoading(false);
  }, [isLoggedIn, user, refreshConversations]);

  return {
    user,
    userData,
    isLoggedIn,
    conversations,
    loading,
    initializing,
    error,
    refreshConversations,
    sendMessage,
    getMessages,
    uploadImage,
    markMessageAsRead,
    updateTypingStatus,
  };
}

