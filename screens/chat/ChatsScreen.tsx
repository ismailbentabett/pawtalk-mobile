import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Searchbar,
  ActivityIndicator,
  Text,
  useTheme,
  Button,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { ChatList } from "../../components/ChatList";
import { MatchesCarousel } from "../../components/MatchesCarousel";
import { useChatContext } from "../../contexts/ChatContext";
import { PetMatch, ChatDisplay } from "../../types/chat";
import ChatService from "../../services/ChatService";
import { useAuth } from "../../hooks/useAuth";

export function ChatsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeMatches, setActiveMatches] = useState<PetMatch[]>([]);
  const { conversations, loading, error } = useChatContext();
  const theme = useTheme();

  const { user } = useAuth();

  const fetchActiveMatches = useCallback(async () => {
    // get conversationsand list tghem as matches
    try {
      if (!user) return;
      const convos = await ChatService.getConversations(user!.uid);
      const matches = convos.map((chat) => ({
        id: chat.petId,
        name: chat.petName,
        avatar: chat.petAvatar,
      }));

      setActiveMatches(matches);
    } catch (error) {
      console.error("Error fetching active matches:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveMatches();
  }, [fetchActiveMatches]);

  const filteredConversations = conversations.filter((chat) =>
    chat.petName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = useCallback(
    (chat: ChatDisplay) => {
      navigation.navigate("ChatRoom", {
        conversationId: chat.id,
        petId: chat.petId,
        petName: chat.petName,
      });
      console.log({
        conversationId: chat.id,
        petId: chat.petId,
        petName: chat.petName,
      });
    },
    [navigation]
  );

  const handleMatchPress = useCallback(
    (match: PetMatch) => {
      const conversation = conversations.find((c) => c.petId === match.id);
      if (conversation) {
        navigation.navigate("ChatRoom", {
          conversationId: conversation.id,
          petId: match.id,
          petName: match.name,
        });
      }
    },
    [navigation, conversations]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Implement refresh logic here
    setRefreshing(false);
  }, []);

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {error}
      </Text>
      <Button
        mode="contained"
        onPress={handleRefresh}
        style={styles.retryButton}
      >
        Retry
      </Button>
    </View>
  );

  const renderContent = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      style={styles.scrollView}
    >
      {activeMatches.length > 0 && (
        <MatchesCarousel
          matches={activeMatches}
          onMatchPress={handleMatchPress}
        />
      )}
      <ChatList chats={filteredConversations} onChatPress={handleChatPress} />
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style="auto" />
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
          Chats
        </Text>
      </View>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search conversations"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
          iconColor={theme.colors.primary}
          inputStyle={{ color: theme.colors.onSurface }}
        />
        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={theme.colors.primary}
          />
        ) : error ? (
          renderError()
        ) : (
          renderContent()
        )}
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
});
