import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Searchbar,
  ActivityIndicator,
  Avatar,
  Badge,
  Text,
  useTheme,
  Button,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../config/firebase';

// Types
type ConversationStatus = 'active' | 'archived';
type MessageType = 'text' | 'image';

interface Conversation {
  id: string;
  participants: string[];
  petId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  status: ConversationStatus;
  lastMessage?: {
    content: string;
    timestamp: Timestamp;
    type: MessageType;
  };
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
  type: MessageType;
  conversationId: string;
}

interface ChatDisplay {
  id: string;
  petId: string;
  petName: string;
  petAvatar: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    type: MessageType;
  };
  unread: number;
}

interface PetMatch {
  id: string;
  name: string;
  avatar: string;
  lastActive?: Date;
  bio?: string;
}

// MatchesCarousel Component
const MatchesCarousel: React.FC<{
  matches: PetMatch[];
  onMatchPress: (match: PetMatch) => void;
}> = ({ matches, onMatchPress }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.matchesContainer, { opacity: fadeAnim }]}>
      <Text style={[styles.matchesTitle, { color: theme.colors.primary }]}>New Matches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {matches.map((match, index) => (
          <Animated.View
            key={match.id}
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * (index + 1), 0]
              }) }]
            }}
          >
            <TouchableOpacity
              style={styles.matchItem}
              onPress={() => onMatchPress(match)}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.accent]}
                style={styles.avatarGradient}
              >
                <Avatar.Image size={70} source={{ uri: match.avatar }} />
              </LinearGradient>
              <Text style={styles.matchName} numberOfLines={1}>
                {match.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

// ChatList Component
const ChatList: React.FC<{
  chats: ChatDisplay[];
  onChatPress: (chat: ChatDisplay) => void;
}> = ({ chats, onChatPress }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderChatItem = ({ item, index }: { item: ChatDisplay; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50 * (index + 1), 0]
        }) }]
      }}
    >
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => onChatPress(item)}
      >
        <Avatar.Image size={60} source={{ uri: item.petAvatar }} />
        <View style={styles.chatItemContent}>
          <View style={styles.chatItemHeader}>
            <Text style={[styles.chatItemName, { color: theme.colors.primary }]}>{item.petName}</Text>
            <Text style={[styles.chatItemTime, { color: theme.colors.onSurfaceVariant }]}>
              {format(item.lastMessage.timestamp, 'MMM d')}
            </Text>
          </View>
          <View style={styles.chatItemFooter}>
            <Text style={[styles.chatItemLastMessage, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
              {item.lastMessage.content}
            </Text>
            {item.unread > 0 && (
              <Badge style={[styles.unreadBadge, { backgroundColor: theme.colors.notification }]}>
                {item.unread}
              </Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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

// Main ChatsScreen Component
export function ChatsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ChatDisplay[]>([]);
  const [activeMatches, setActiveMatches] = useState<PetMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchPetDetails = async (petId: string) => {
    try {
      const petDoc = await getDoc(doc(db, 'pets', petId));
      if (!petDoc.exists()) {
        console.error('Pet not found:', petId);
        return null;
      }
      
      const petData = petDoc.data();
      return {
        name: petData.name || 'Unknown Pet',
        avatar: petData.images?.main || '/placeholder.svg?height=50&width=50',
        bio: petData.bio || '',
      };
    } catch (err) {
      console.error('Error fetching pet details:', err);
      return null;
    }
  };

  const fetchLastMessage = async (conversationId: string): Promise<Message | null> => {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const messageSnapshot = await getDocs(messagesQuery);
      if (messageSnapshot.empty) {
        return null;
      }

      return {
        id: messageSnapshot.docs[0].id,
        ...messageSnapshot.docs[0].data()
      } as Message;
    } catch (err) {
      console.error('Error fetching last message:', err);
      return null;
    }
  };

  const fetchActiveMatches = async (userId: string) => {
    try {
      const matchesQuery = query(
        collection(db, 'matches'),
        where('userId', '==', userId),
        where('status', '==', 'matched'),
        orderBy('matchedAt', 'desc')
      );

      const matchSnapshot = await getDocs(matchesQuery);
      const matchPromises = matchSnapshot.docs.map(async (matchDoc) => {
        const matchData = matchDoc.data();
        const petDetails = await fetchPetDetails(matchData.petId);
        
        if (!petDetails) return null;

        return {
          id: matchData.petId,
          name: petDetails.name,
          avatar: petDetails.avatar,
          bio: petDetails.bio,
          lastActive: matchData.lastActive?.toDate(),
        };
      });

      const matches = (await Promise.all(matchPromises)).filter((match): match is PetMatch => match !== null);
      setActiveMatches(matches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  const fetchConversations = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('No authenticated user found');
      setLoading(false);
      return;
    }

    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('lastMessageAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        conversationsQuery,
        async (snapshot) => {
          const conversationPromises = snapshot.docs.map(async (doc) => {
            const convData = doc.data() as Conversation;
            const petDetails = await fetchPetDetails(convData.petId);

            if (!petDetails) return null;

            const lastMessage = await fetchLastMessage(doc.id);

            return {
              id: doc.id,
              petId: convData.petId,
              petName: petDetails.name,
              petAvatar: petDetails.avatar,
              lastMessage: {
                content: lastMessage?.content || 'Start chatting!',
                timestamp: lastMessage?.createdAt.toDate() || convData.createdAt.toDate(),
                type: lastMessage?.type || 'text',
              },
              unread: 0, // Implement unread count logic if needed
            };
          });

          const validConversations = (await Promise.all(conversationPromises))
            .filter((conv): conv is ChatDisplay => conv !== null);

          setConversations(validConversations);
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('Conversations subscription error:', err);
          setError('Failed to subscribe to conversations');
          setLoading(false);
          setRefreshing(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up conversations subscription:', err);
      setError('Failed to load conversations');
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('No authenticated user found');
      setLoading(false);
      return;
    }

    fetchActiveMatches(currentUser.uid);
    const unsubscribe = fetchConversations();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((chat) =>
    chat.petName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = useCallback((chat: ChatDisplay) => {
    navigation.navigate('ChatRoom', {
      conversationId: chat.id,
      petId: chat.petId,
      petName: chat.petName,
    });
  }, [navigation]);

  const handleMatchPress = useCallback((match: PetMatch) => {
    const conversation = conversations.find(c => c.petId === match.id);
    if (conversation) {
      navigation.navigate('ChatRoom', {
        conversationId: conversation.id,
        petId: match.id,
        petName: match.name,
      });
    }
  }, [navigation, conversations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      <Button mode="contained" onPress={handleRefresh} style={styles.retryButton}>
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
      <ChatList 
        chats={filteredConversations}
        onChatPress={handleChatPress}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, opacity: fadeAnim }
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Chats</Text>
      </Animated.View>
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Searchbar
            placeholder="Search conversations"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            iconColor={theme.colors.primary}
            inputStyle={{ color: theme.colors.onSurface }}
          />
        </Animated.View>
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
        ) : error ? (
          renderError()
        ) : (
          renderContent()
        )}
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  matchesContainer: {
    padding: 16,
    marginBottom: 8,
  },
  matchesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  matchItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatarGradient: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchName: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 80,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatItemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatItemTime: {
    fontSize: 12,
  },
  chatItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatItemLastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    marginLeft: 8,
  },
});

