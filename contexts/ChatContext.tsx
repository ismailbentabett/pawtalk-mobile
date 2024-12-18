import React, { createContext, useContext } from "react";
import { useChat } from "../hooks/useChat";
import { ChatDisplay, Message, MessageType } from "../types/chat";

interface ChatContextType {
  conversations: ChatDisplay[];
  loading: boolean;
  error: string | null;
  refreshConversations: () => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    type?: MessageType,
    gifUrl?: string
  ) => Promise<void>;
  getMessages: (conversationId: string) => Promise<Message[]>;
  uploadImage: (uri: string) => Promise<string>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  updateTypingStatus: (
    conversationId: string,
    userId: string,
    isTyping: boolean
  ) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const chatHook = useChat();

  return (
    <ChatContext.Provider value={chatHook}>{children}</ChatContext.Provider>
  );
};
