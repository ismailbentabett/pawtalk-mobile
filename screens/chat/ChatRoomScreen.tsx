import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Appbar, TextInput, useTheme, Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Send, Paperclip, Smile, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import EmojiSelector from 'react-native-emoji-selector';
import Modal from 'react-native-modal';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
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
} from 'firebase/firestore';
import { format } from 'date-fns';
import { auth, db } from '../../config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;

interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  type: 'text' | 'image';
  read: boolean;
}

interface PetDetails {
  name: string;
  avatar: string;
  bio?: string;
}

interface Props {
  navigation: any;
  route: {
    params: {
      conversationId: string;
      petId: string;
      petName: string;
    };
  };
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dkdscxzz7';
const CLOUDINARY_UPLOAD_PRESET = 'pawtalk';

const uploadToCloudinary = async (uri: string): Promise<string> => {
  try {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export function ChatRoomScreen({ navigation, route }: Props) {
  const { conversationId, petId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [petDetails, setPetDetails] = useState<PetDetails | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();
  const currentUser = auth.currentUser;
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch pet details
  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!petId) return;
      
      try {
        const petDoc = await getDoc(doc(db, 'pets', petId));
        if (petDoc.exists()) {
          const data = petDoc.data();
          setPetDetails({
            name: data.name,
            avatar: data.images?.main || '/placeholder.png',
            bio: data.bio,
          });
        }
      } catch (error) {
        console.error('Error fetching pet details:', error);
        Alert.alert('Error', 'Failed to load pet details');
      }
    };

    fetchPetDetails();
  }, [petId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Message[];

        setMessages(newMessages);
        setIsLoading(false);

        newMessages.forEach(msg => {
          if (msg.senderId !== currentUser.uid && !msg.read) {
            updateDoc(doc(db, 'messages', msg.id), { read: true })
              .catch(console.error);
          }
        });
      },
      (error) => {
        console.error('Messages subscription error:', error);
        Alert.alert('Error', 'Failed to load messages');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, currentUser?.uid]);

  const updateConversationTimestamp = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    if (!currentUser || !conversationId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        content,
        conversationId,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        type,
        read: false
      });

      await updateConversationTimestamp();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const messageText = message.trim();
    setMessage('');
    await sendMessage(messageText, 'text');
  };

  // Image handling
  const compressImage = async (uri: string) => {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return result.uri;
  };

  const handleImageSend = async (uri: string) => {
    setUploadingImage(true);
    try {
      const compressedUri = await compressImage(uri);
      const cloudinaryUrl = await uploadToCloudinary(compressedUri);
      await sendMessage(cloudinaryUrl, 'image');
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setUploadingImage(false);
    }
  };

  const requestPermission = async (type: 'camera' | 'library') => {
    const { status } = await (type === 'camera' 
      ? ImagePicker.requestCameraPermissionsAsync()
      : ImagePicker.requestMediaLibraryPermissionsAsync());
      
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        `Please grant ${type} permissions to ${type === 'camera' ? 'take photos' : 'upload images'}.`
      );
      return false;
    }
    return true;
  };

  const handleAttachment = async () => {
    if (!await requestPermission('library')) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageSend(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCamera = async () => {
    if (!await requestPermission('camera')) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageSend(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleEmoji = () => setIsEmojiPickerVisible(true);
  
  const onEmojiSelected = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiPickerVisible(false);
  };

  const updateTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!conversationId || !currentUser) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`typing.${currentUser.uid}`]: isTyping
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [conversationId, currentUser]);

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.senderId === currentUser?.uid;
    const messageTime = format(item.createdAt, 'HH:mm');

    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer
      ]}>
        {!isUserMessage && petDetails && (
          <Avatar.Image
            size={24}
            source={{ uri: petDetails.avatar }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isUserMessage ? styles.userMessage : styles.otherMessage
        ]}>
          {item.type === 'text' ? (
            <Text style={[
              styles.messageText,
              isUserMessage ? styles.userMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('ImagePreview', { imageUrl: item.content })}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: item.content }}
                style={[
                  styles.messageImage,
                  isUserMessage ? styles.userMessageImage : styles.otherMessageImage
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isUserMessage ? styles.userTimestamp : styles.otherTimestamp
            ]}>
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        />

        {uploadingImage && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.uploadingText}>Sending image...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleEmoji} style={styles.iconButton}>
            <Smile color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAttachment} style={styles.iconButton}>
            <Paperclip color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCamera} style={styles.iconButton}>
            <Camera color={theme.colors.primary} size={24} />
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
                  <TouchableOpacity onPress={handleSend} disabled={!message.trim()}>
                    <Send 
                      color={message.trim() ? theme.colors.primary : theme.colors.disabled} 
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
        swipeDirection={['down']}
        propagateSwipe
      >
        <View style={styles.emojiContainer}>
          <View style={styles.emojiHeader}>
            <View style={styles.emojiHandleBar} />
          </View>
          <EmojiSelector
            onEmojiSelected={onEmojiSelected}
            columns={8}
            showSearchBar={false}
            showTabs={true}
            showHistory={true}
            showSectionTitles={true}
            category={[
              'smileys',
              'animals',
              'food',
              'activities',
              'objects',
              'symbols',
            ]}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    elevation: 2,
    backgroundColor: '#FFFFFF',
    height: 60,
  },
  backButton: {
    marginLeft: 8,
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
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
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    maxWidth: '100%',
  },
  userMessage: {
    backgroundColor: '#0084FF',
    borderTopRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageImage: {
    width: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_WIDTH * 0.75,
    borderRadius: 12,
  },
  userMessageImage: {
    backgroundColor: '#0084FF',
  },
  otherMessageImage: {
    backgroundColor: '#F0F0F0',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  readReceipt: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginLeft: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  emojiContainer: {
    height: 400,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emojiHeader: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  emojiHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    borderRadius: 20,
  },
  uploadingText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
});