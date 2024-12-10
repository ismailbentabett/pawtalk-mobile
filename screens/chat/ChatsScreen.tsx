import React, { useState, useEffect } from "react";
import { StyleSheet, View, SafeAreaView, Text } from "react-native";
import { Searchbar, ActivityIndicator } from "react-native-paper";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ChatList } from "../../components/ChatList";
import { MatchesCarousel } from "../../components/MatchesCarousel";
import { auth, db } from "../../config/firebase";

// Types
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: "text" | "image";
}

interface Chat {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: Message;
  unread: number;
}

interface Match {
  id: string;
  name: string;
  avatar: string;
  lastActive?: Date;
  bio?: string;
}

export function ChatsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeMatches: (() => void) | undefined;
    let unsubscribeChats: (() => void) | undefined;

    async function setupSubscriptions() {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("No authenticated user found");
          setLoading(false);
          return;
        }

        // Subscribe to matches
        const matchesQuery = query(
          collection(db, "matches"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "matched"),
          orderBy("matchedAt", "desc")
        );

        unsubscribeMatches = onSnapshot(
          matchesQuery,
          async (snapshot) => {
            try {
              const matchPromises = snapshot.docs.map(async (doc) => {
                const matchData = doc.data();
                const userDoc = await getDoc(
                  doc(db, "users", matchData.matchedUserId)
                );
                const userData = userDoc.data();

                return {
                  id: doc.id,
                  name: userData?.displayName || "Unknown",
                  avatar:
                    userData?.profileImage ||
                    "/placeholder.svg?height=80&width=80",
                  lastActive: userData?.lastLoginAt?.toDate(),
                  bio: userData?.bio,
                };
              });

              const matchResults = await Promise.all(matchPromises);
              setMatches(matchResults);
            } catch (err) {
              console.error("Error fetching match details:", err);
              setError("Failed to load matches");
            }
          },
          (err) => {
            console.error("Error in matches subscription:", err);
            setError("Failed to subscribe to matches");
          }
        );

        // Subscribe to chats
        const chatsQuery = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUser.uid),
          orderBy("lastMessageAt", "desc")
        );

        unsubscribeChats = onSnapshot(
          chatsQuery,
          async (snapshot) => {
            try {
              const chatPromises = snapshot.docs.map(async (doc) => {
                const chatData = doc.data();
                const otherUserId = chatData.participants.find(
                  (id: string) => id !== currentUser.uid
                );

                const userDoc = await getDoc(doc(db, "users", otherUserId));
                const userData = userDoc.data();

                const lastMessage = chatData.lastMessage || {
                  id: "",
                  senderId: "",
                  text: "Start chatting!",
                  timestamp: new Date(),
                  type: "text",
                };

                return {
                  id: doc.id,
                  userId: otherUserId,
                  userName: userData?.displayName || "Unknown",
                  userAvatar:
                    userData?.profileImage ||
                    "/placeholder.svg?height=50&width=50",
                  lastMessage: {
                    id: lastMessage.id,
                    senderId: lastMessage.senderId,
                    text: lastMessage.text,
                    timestamp: lastMessage.timestamp?.toDate() || new Date(),
                    type: lastMessage.type,
                  },
                  unread: chatData.unreadCount?.[currentUser.uid] || 0,
                };
              });

              const chatResults = await Promise.all(chatPromises);

              console.log(chatResults);
              setChats(chatResults);
            } catch (err) {
              console.error("Error fetching chat details:", err);
              setError("Failed to load chats");
            }
          },
          (err) => {
            console.error("Error in chats subscription:", err);
            setError("Failed to subscribe to chats");
          }
        );

        setLoading(false);
      } catch (err) {
        console.error("Error setting up subscriptions:", err);
        setError("Failed to initialize chat screen");
        setLoading(false);
      }
    }

    setupSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (unsubscribeMatches) unsubscribeMatches();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, []);

  const handleMatchPress = async (match: Match) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("No authenticated user found");
        return;
      }

      // Check if chat already exists
      const chatQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid),
        where("matchId", "==", match.id)
      );

      const chatSnapshot = await getDocs(chatQuery);
      let chatId: string;

      if (chatSnapshot.empty) {
        // Create new chat
        const chatRef = doc(collection(db, "chats"));
        const chatData = {
          participants: [currentUser.uid, match.id],
          matchId: match.id,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [match.id]: 0,
          },
        };

        await setDoc(chatRef, chatData);
        chatId = chatRef.id;
      } else {
        chatId = chatSnapshot.docs[0].id;
      }

      navigation.navigate("ChatRoom", { chatId });
    } catch (err) {
      console.error("Error handling match press:", err);
      setError("Failed to open chat");
    }
  };

  const handleChatPress = (chat: Chat) => {
    navigation.navigate("ChatRoom", { chatId: chat.id });
  };

  const filteredChats = chats.filter((chat) => {
    console.log(chat);
    return chat.userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const renderContent = () => (
    <>
      <MatchesCarousel matches={matches} onMatchPress={handleMatchPress} />

      <ChatList chats={filteredChats} onChatPress={handleChatPress} />
    </>
  );

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
        ) : error ? (
          renderError()
        ) : (
          renderContent()
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  },
});
