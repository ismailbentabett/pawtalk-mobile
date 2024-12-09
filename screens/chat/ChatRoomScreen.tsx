import React, { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Alert } from 'react-native';
import { Appbar, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Send, Paperclip, Smile } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import EmojiSelector from 'react-native-emoji-selector';
import Modal from 'react-native-modal';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  type: 'text' | 'image';
  content?: string;
}

export const ChatRoomScreen: React.FC = ({ navigation, route }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const compressImage = async (uri: string) => {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return result.uri;
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([newMessage, ...messages]);
      setMessage('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleAttachment = async () => {
    if (!await requestPermissions()) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          content: compressedUri
        };
        setMessages([newMessage, ...messages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: '',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          content: compressedUri
        };
        setMessages([newMessage, ...messages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleEmoji = () => {
    setIsEmojiPickerVisible(true);
  };

  const onEmojiSelected = (emoji: string) => {
    setMessage(prevMessage => prevMessage + emoji);
    setIsEmojiPickerVisible(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender === 'user';
    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? dynamicStyles.userMessage : dynamicStyles.otherMessage
      ]}>
        {item.type === 'text' ? (
          <Text style={styles.messageText}>{item.text}</Text>
        ) : (
          <Image
            source={{ uri: item.content }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const dynamicStyles = {
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: '#F0F0F0',
    },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.primary} />
        <Appbar.Content 
          title={route.params?.userName || 'Chat'} 
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action icon="dots-vertical" onPress={() => {}} color={theme.colors.primary} />
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
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleEmoji} style={styles.iconButton}>
            <Smile size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAttachment} style={styles.iconButton}>
            <Paperclip size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCamera} style={styles.iconButton}>
            <Camera size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            style={styles.input}
            right={
              <TextInput.Icon 
                icon={() => <Send size={24} color={theme.colors.primary} />} 
                onPress={handleSend} 
              />
            }
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        isVisible={isEmojiPickerVisible}
        onBackdropPress={() => setIsEmojiPickerVisible(false)}
        style={styles.modal}
      >
        <View style={styles.emojiContainer}>
          <EmojiSelector
            onEmojiSelected={onEmojiSelected}
            columns={8}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    elevation: 0,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  iconButton: {
    padding: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  emojiContainer: {
    height: 300,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});