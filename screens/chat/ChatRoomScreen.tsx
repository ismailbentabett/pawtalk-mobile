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
} from "react-native";
import { Appbar, TextInput, useTheme, Text, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Send, Paperclip, Smile, ArrowLeft } from "lucide-react-native";
import Modal from "react-native-modal";
import { format } from "date-fns";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EmojiPicker } from "../../components/EmojiPicker";
import { MediaPicker } from "../../components/MediaPicker";
import { auth } from "../../config/firebase";
import { useChatContext } from "../../contexts/ChatContext";
import ChatService from "../../services/ChatService";
import { PetDetails } from "../../types/chat";
import { Message } from "../../types/Message";



const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;

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

export function ChatRoomScreen({ navigation, route }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [isMediaPickerVisible, setIsMediaPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [petDetails, setPetDetails] = useState<PetDetails | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();
  const currentUser = auth.currentUser;
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { conversationId, petId, petName } = route.params;
  const {
    sendMessage,
    getMessages,
    uploadImage,
    markMessageAsRead,
    updateTypingStatus,
  } = useChatContext();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await getMessages(conversationId);
        setMessages(fetchedMessages as unknown as Message[]);
        setIsLoading(false);

        fetchedMessages.forEach((msg) => {
          if (msg.senderId !== currentUser?.uid && !msg.read) {
            markMessageAsRead(msg.id);
          }
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert("Error", "Failed to load messages");
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, currentUser?.uid, getMessages, markMessageAsRead]);

  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!petId) return;

      try {
        const details = await ChatService.fetchPetDetails(petId);
        if (details) {
          setPetDetails(details);
        }
      } catch (error) {
        console.error("Error fetching pet details:", error);
        Alert.alert("Error", "Failed to load pet details");
      }
    };

    fetchPetDetails();
  }, [petId]);

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

  const handleSend = async () => {
    if (!message.trim()) return;
    const messageText = message.trim();
    setMessage("");
    try {
      await sendMessage(conversationId, messageText, "text");
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handleImageSelect = async (imagePath: string) => {
    setUploadingMedia(true);
    try {
      const cloudinaryUrl = await uploadImage(imagePath);
      await sendMessage(conversationId, cloudinaryUrl, "image");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to send image");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleGifSelect = async (gif: { url: string; preview: string }) => {
    try {
      await sendMessage(conversationId, gif.preview, "gif", gif.url);
    } catch (error) {
      console.error("Error sending GIF:", error);
      Alert.alert("Error", "Failed to send GIF");
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    updateTypingStatus(conversationId, currentUser!.uid, true);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(conversationId, currentUser!.uid, false);
    }, 2000);
  };

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