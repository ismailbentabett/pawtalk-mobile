import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Surface, Text } from "react-native-paper";
import type { Chat } from "../types/chat";

interface ChatListProps {
  chats: Chat[];
  onChatPress: (chat: Chat) => void;
}

export function ChatList({ chats, onChatPress }: ChatListProps) {
  const renderItem = ({ item: chat }: { item: Chat }) => (
    <TouchableOpacity onPress={() => onChatPress(chat)}>
      <Surface style={styles.chatItem} elevation={0}>
        <Avatar.Image size={50} source={{ uri: chat.userAvatar }} />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text variant="titleMedium">{chat.userName}</Text>
            {chat.lastMessage && (
              <Text variant="bodySmall" style={styles.timestamp}>
                {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>
          {chat.lastMessage && (
            <Text
              variant="bodyMedium"
              numberOfLines={1}
              style={styles.lastMessage}
            >
              {chat.lastMessage.text}
            </Text>
          )}
        </View>
        {chat.unread && chat.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{chat.unread}</Text>
          </View>
        )}
      </Surface>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={chats}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    backgroundColor: "white",
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timestamp: {
    color: "#666",
  },
  lastMessage: {
    color: "#666",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
