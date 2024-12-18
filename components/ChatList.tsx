import React, { useEffect, useRef, memo } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  FlatList,
} from "react-native";
import {
  Avatar,
  Text,
  Badge,
  useTheme,
  MD3Theme as Theme,
} from "react-native-paper";
import { format } from "date-fns";
import { ChatDisplay } from "../types/chat";

interface ChatListProps {
  chats: ChatDisplay[];
  onChatPress: (chat: ChatDisplay) => void;
}

const ChatListItem = memo(
  ({
    item,
    onPress,
    theme,
    fadeAnim,
    index,
  }: {
    item: ChatDisplay;
    onPress: () => void;
    theme: Theme;
    fadeAnim: Animated.Value;
    index: number;
  }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50 * (index + 1), 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.colors.surface }]}
        onPress={onPress}
      >
        <Avatar.Image
          size={60}
          source={{ uri: item.petAvatar }}
          style={styles.avatar}
        >
          {!item.images?.main && (
            <Text style={styles.avatarText}>
              {item.petName.charAt(0).toUpperCase()}
            </Text>
          )}
        </Avatar.Image>
        <View style={styles.chatItemContent}>
          <View style={styles.chatItemHeader}>
            <Text
              style={[styles.chatItemName, { color: theme.colors.primary }]}
            >
              {item.petName}
            </Text>
            <Text
              style={[
                styles.chatItemTime,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {format(item.lastMessage.timestamp, "MMM d")}
            </Text>
          </View>
          <View style={styles.chatItemFooter}>
            <Text
              style={[
                styles.chatItemLastMessage,
                { color: theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.content}
            </Text>
            {item.unread > 0 && (
              <Badge
                style={[
                  styles.unreadBadge,
                  { backgroundColor: theme.colors.error },
                ]}
              >
                {item.unread}
              </Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
);

export const ChatList: React.FC<ChatListProps> = ({ chats, onChatPress }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderChatItem = ({
    item,
    index,
  }: {
    item: ChatDisplay;
    index: number;
  }) => (
    <ChatListItem
      item={item}
      onPress={() => onChatPress(item)}
      theme={theme}
      fadeAnim={fadeAnim}
      index={index}
    />
  );

  return (
    <FlatList
      data={chats}
      renderItem={renderChatItem}
      keyExtractor={(item) => item.id}
      style={styles.chatList}
      contentContainerStyle={styles.chatListContent}
    />
  );
};

const styles = StyleSheet.create({
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  chatItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  chatItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatItemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  chatItemTime: {
    fontSize: 12,
  },
  chatItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  chatItemLastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    marginLeft: 8,
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    color: "white",
  },
});
