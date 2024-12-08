import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { Searchbar, ActivityIndicator } from "react-native-paper";
import { Match, Chat } from "../../types/chat";
import { ChatList } from "../../components/ChatList";
import { MatchesCarousel } from "../../components/MatchesCarousel";


export function ChatsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const matches: Match[] = [
    { id: "1", name: "Sarah", avatar: "/placeholder.svg?height=80&width=80" },
    { id: "2", name: "Mike", avatar: "/placeholder.svg?height=80&width=80" },
    { id: "3", name: "Emma", avatar: "/placeholder.svg?height=80&width=80" },
    // Add more matches...
  ];

  const chats: Chat[] = [
    {
      id: "1",
      userId: "1",
      userName: "Sarah",
      userAvatar: "/placeholder.svg?height=50&width=50",
      lastMessage: {
        id: "1",
        senderId: "1",
        text: "Hey, how are you?",
        timestamp: new Date(),
        type: "text",
      },
      unread: 2,
    },
    // Add more chats...
  ];

  const handleMatchPress = (match: Match) => {
    navigation.navigate("ChatRoom", { matchId: match.id });
  };

  const handleChatPress = (chat: Chat) => {
    navigation.navigate("ChatRoom", { chatId: chat.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search matches"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <>
            <MatchesCarousel
              matches={matches}
              onMatchPress={handleMatchPress}
            />
            <ChatList chats={chats} onChatPress={handleChatPress} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 0,
    backgroundColor: "#F2F2F2",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
