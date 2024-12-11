import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  TextInput as RNTextInput,
} from "react-native";
import { Appbar, TextInput, useTheme, Text, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Search,
} from "lucide-react-native";
import Modal from "react-native-modal";
import { debounce } from "lodash";
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  limit,
} from "firebase/firestore";
import { format } from "date-fns";
import { auth, db } from "../../config/firebase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;
const CLOUDINARY_CLOUD_NAME = "dkdscxzz7";
const CLOUDINARY_UPLOAD_PRESET = "pawtalk";
const GIPHY_API_KEY = process.env.EXPO_GIPHY_API_KEY
const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";

// Emoji data for custom emoji picker
const EMOJI_CATEGORIES: { [key in EmojiCategory]: string[] } = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
  ],
  animals: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
  ],
  foods: [
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
  ],
  activities: [
    "⚽️",
    "🏀",
    "🏈",
    "⚾️",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
  ],
  objects: [
    "⌚️",
    "📱",
    "💻",
    "⌨️",
    "🖥",
    "🖨",
    "🖱",
    "🖲",
    "🕹",
    "🗜",
    "💽",
    "💾",
    "💿",
    "📀",
  ],
  symbols: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
  ],
};

// Types
type EmojiCategory = 'smileys' | 'animals' | 'foods' | 'activities' | 'objects' | 'symbols';
interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  type: "text" | "image" | "gif";
  read: boolean;
  gifUrl?: string;
}

interface PetDetails {
  name: string;
  avatar: string;
  bio?: string;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
  title: string;
}

type RootStackParamList = {
  ChatRoom: {
    conversationId: string;
    petId: string;
    petName: string;
  };
  ImagePreview: {
    imageUrl: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "ChatRoom">;

interface MediaPickerProps {
  onClose: () => void;
  onImageSelect: (path: string) => void;
  onGifSelect: (gif: { url: string; preview: string }) => void;
}

// Custom EmojiPicker Component
const EmojiPicker: React.FC<{
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onEmojiSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<EmojiCategory>("smileys");
  const theme = useTheme();

  return (
    <View style={styles.emojiPickerContainer}>
      <View style={styles.emojiPickerHeader}>
        <Text style={styles.emojiPickerTitle}>Choose Emoji</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.emojiCategoryContainer}>
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={EMOJI_CATEGORIES[selectedCategory]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => onEmojiSelect(item)}
          >
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
        numColumns={8}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.emojiList}
      />
    </View>
  );
};

// GifPicker Component
const GifPicker: React.FC<{
  onGifSelect: (gif: { url: string; preview: string }) => void;
  onClose: () => void;
}> = ({ onGifSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query
        ? `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
            query
          )}&limit=20&rating=g`
        : `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.meta.status === 200) {
        setGifs(data.data);
      } else {
        throw new Error(data.meta.msg);
      }
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      Alert.alert("Error", "Failed to load GIFs");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => searchGifs(query), 500),
    []
  );

  useEffect(() => {
    searchGifs("");
  }, []);

  return (
    <View style={styles.gifPickerContainer}>
      <View style={styles.gifPickerHeader}>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Search GIFs..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              debouncedSearch(text);
            }}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.gifLoader}
          size="large"
          color={theme.colors.primary}
        />
      ) : (
        <FlatList
          data={gifs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gifItem}
              onPress={() =>
                onGifSelect({
                  url: item.images.original.url,
                  preview: item.images.fixed_width.url,
                })
              }
            >
              <Image
                source={{ uri: item.images.fixed_width.url }}
                style={styles.gifPreview}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          numColumns={2}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.gifColumnWrapper}
        />
      )}
    </View>
  );
};

const MediaPicker: React.FC<MediaPickerProps> = ({
  onClose,
  onImageSelect,
  onGifSelect,
}) => {
  const [showGifPicker, setShowGifPicker] = useState(false);
  const theme = useTheme();

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
      console.error('Camera error:', error);
    }
  };

  if (showGifPicker) {
    return (
      <GifPicker
        onGifSelect={onGifSelect}
        onClose={() => setShowGifPicker(false)}
      />
    );
  }


  return (
    <View style={styles.mediaPickerContainer}>
      <View style={styles.mediaPickerHeader}>
        <Text style={styles.mediaPickerTitle}>Share Media</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mediaOptions}>
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={handleCameraCapture}
          >
            <Camera size={32} color={theme.colors.onSurface} />
            <Text style={styles.mediaOptionText}>Camera</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.mediaOption} 
          onPress={handleImagePick}
        >
          <ImageIcon size={32} color={theme.colors.onSurface} />
          <Text style={styles.mediaOptionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mediaOption}
          onPress={() => setShowGifPicker(true)}
        >
          <Text style={styles.gifIcon}>GIF</Text>
          <Text style={styles.mediaOptionText}>GIF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Cloudinary upload helper
const uploadToCloudinary = async (uri: string): Promise<string> => {
  try {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "image.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image";

    formData.append("file", {
      uri,
      name: filename,
      type,
    } as any);

    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// Main ChatRoomScreen component
export function ChatRoomScreen({ navigation, route }: Props) {
  // States
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [isMediaPickerVisible, setIsMediaPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [petDetails, setPetDetails] = useState<PetDetails | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();
  const currentUser = auth.currentUser;
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { conversationId, petId } = route.params;

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch pet details
  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!petId) return;

      try {
        const petDoc = await getDoc(doc(db, "pets", petId));
        if (petDoc.exists()) {
          const data = petDoc.data();
          setPetDetails({
            name: data.name,
            avatar: data.images?.main || "/placeholder.png",
            bio: data.bio,
          });
        }
      } catch (error) {
        console.error("Error fetching pet details:", error);
        Alert.alert("Error", "Failed to load pet details");
      }
    };

    fetchPetDetails();
  }, [petId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Message[];

        setMessages(newMessages);
        setIsLoading(false);

        // Mark messages as read
        newMessages.forEach((msg) => {
          if (msg.senderId !== currentUser.uid && !msg.read) {
            updateDoc(doc(db, "messages", msg.id), { read: true }).catch(
              console.error
            );
          }
        });
      },
      (error) => {
        console.error("Messages subscription error:", error);
        Alert.alert("Error", "Failed to load messages");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, currentUser?.uid]);

  const sendMessage = async (
    content: string,
    type: "text" | "image" | "gif" = "text",
    gifUrl?: string
  ) => {
    if (!currentUser || !conversationId) return;

    try {
      const messageData: any = {
        content,
        conversationId,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        type,
        read: false,
      };

      if (type === "gif" && gifUrl) {
        messageData.gifUrl = gifUrl;
      }

      await addDoc(collection(db, "messages"), messageData);
      await updateConversationTimestamp();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const messageText = message.trim();
    setMessage("");
    await sendMessage(messageText, "text");
  };

  const handleImageSelect = async (imagePath: string) => {
    setUploadingMedia(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(imagePath);
      await sendMessage(cloudinaryUrl, "image");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to send image");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleGifSelect = async (gif: { url: string; preview: string }) => {
    try {
      await sendMessage(gif.preview, "gif", gif.url);
    } catch (error) {
      console.error("Error sending GIF:", error);
      Alert.alert("Error", "Failed to send GIF");
    }
  };

  // Typing indicator
  const updateTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId || !currentUser) return;

      try {
        const conversationRef = doc(db, "conversations", conversationId);
        await updateDoc(conversationRef, {
          [`typing.${currentUser.uid}`]: isTyping,
        });
      } catch (error) {
        console.error("Error updating typing status:", error);
      }
    },
    [conversationId, currentUser]
  );

  const handleTextChange = (text: string) => {
    setMessage(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    updateTypingStatus(true);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  // Update conversation timestamp
  const updateConversationTimestamp = useCallback(async () => {
    if (!conversationId) return;

    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating conversation timestamp:", error);
    }
  }, [conversationId]);

  // Message renderer
  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.senderId === currentUser?.uid;
    const messageTime = format(item.createdAt, "HH:mm");

    return (
      <View
        style={[
          styles.messageContainer,
          isUserMessage
            ? styles.userMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {!isUserMessage && petDetails && (
          <Avatar.Image
            size={24}
            source={{ uri: petDetails.avatar }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isUserMessage ? styles.userMessage : styles.otherMessage,
          ]}
        >
          {item.type === "text" ? (
            <Text
              style={[
                styles.messageText,
                isUserMessage
                  ? styles.userMessageText
                  : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ImagePreview", {
                  imageUrl: item.type === "gif" ? item.gifUrl! : item.content,
                })
              }
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: item.type === "gif" ? item.gifUrl : item.content,
                }}
                style={[
                  styles.messageImage,
                  isUserMessage
                    ? styles.userMessageImage
                    : styles.otherMessageImage,
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestamp,
                isUserMessage ? styles.userTimestamp : styles.otherTimestamp,
              ]}
            >
              {messageTime}
            </Text>
            {isUserMessage && item.read && (
              <Text style={styles.readReceipt}>Read</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        {petDetails && (
          <View style={styles.headerContent}>
            <Avatar.Image
              size={40}
              source={{ uri: petDetails.avatar }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerTitle}>{petDetails.name}</Text>
              {otherUserTyping && (
                <Text style={styles.typingIndicator}>typing...</Text>
              )}
            </View>
          </View>
        )}
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        />

        {uploadingMedia && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.uploadingText}>Sending media...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              setIsEmojiPickerVisible(true);
            }}
            style={styles.iconButton}
          >
            <Smile color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              setIsMediaPickerVisible(true);
            }}
            style={styles.iconButton}
          >
            <Paperclip color={theme.colors.primary} size={24} />
          </TouchableOpacity>

          <TextInput
            value={message}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            style={styles.input}
            multiline
            maxLength={1000}
            right={
              <TextInput.Icon
                icon={() => (
                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={!message.trim()}
                    style={styles.sendButton}
                  >
                    <Send
                      color={
                        message.trim()
                          ? theme.colors.primary
                          : theme.colors.disabled
                      }
                      size={24}
                    />
                  </TouchableOpacity>
                )}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        isVisible={isEmojiPickerVisible}
        onBackdropPress={() => setIsEmojiPickerVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        onSwipeComplete={() => setIsEmojiPickerVisible(false)}
        swipeDirection={["down"]}
      >
        <EmojiPicker
          onEmojiSelect={(emoji) => {
            setMessage((prev) => prev + emoji);
            setIsEmojiPickerVisible(false);
          }}
          onClose={() => setIsEmojiPickerVisible(false)}
        />
      </Modal>

      <Modal
        isVisible={isMediaPickerVisible}
        onBackdropPress={() => setIsMediaPickerVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        onSwipeComplete={() => setIsMediaPickerVisible(false)}
        swipeDirection={["down"]}
      >
        <MediaPicker
          onClose={() => setIsMediaPickerVisible(false)}
          onImageSelect={handleImageSelect}
          onGifSelect={handleGifSelect}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    elevation: 2,
    backgroundColor: "#FFFFFF",
    height: 60,
  },
  backButton: {
    marginLeft: 8,
    padding: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  typingIndicator: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
  content: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: "flex-end",
    marginBottom: 15,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    maxWidth: "100%",
  },
  userMessage: {
    backgroundColor: "#0084FF",
    borderTopRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#000000",
  },
  messageImage: {
    width: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_WIDTH * 0.75,
    borderRadius: 12,
  },
  userMessageImage: {
    backgroundColor: "#0084FF",
  },
  otherMessageImage: {
    backgroundColor: "#F0F0F0",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: "rgba(0, 0, 0, 0.5)",
  },
  readReceipt: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginLeft: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  sendButton: {
    padding: 8,
  },
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  // Emoji Picker styles
  emojiPickerContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emojiPickerHeader: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emojiCategoryContainer: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
  },
  selectedCategory: {
    backgroundColor: "#E3F2FD",
  },
  categoryText: {
    fontSize: 14,
    color: "#666666",
    textTransform: "capitalize",
  },
  emojiButton: {
    width: `${100 / 8}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  emojiList: {
    padding: 8,
  },
  // GIF Picker styles
  gifPickerContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gifPickerHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#000000",
    fontSize: 16,
  },
  gifLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gifItem: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  gifPreview: {
    width: "100%",
    aspectRatio: 1,
  },
  gifColumnWrapper: {
    padding: 4,
  },
  // Media Picker styles
  mediaPickerContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mediaPickerHeader: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  mediaPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    color: "#007AFF",
    fontSize: 16,
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: Platform.OS === 'web' ? 'center' : 'space-around',
    padding: 20,
    gap: Platform.OS === 'web' ? 40 : 0,
  },
  mediaOption: {
    alignItems: "center",
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 14,
  },
  gifIcon: {
    fontSize: 32,
    fontWeight: "bold",
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    borderRadius: 20,
  },
  uploadingText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
});
