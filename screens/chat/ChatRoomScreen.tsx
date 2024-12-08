import React, { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Image, Send, Paperclip, Smile } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  type: 'text' | 'image' | 'gif';
  content?: string;
}

export const ChatRoomScreen: React.FC = ({ navigation, route }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const theme = useTheme();

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

  const handleAttachment = () => {
    // Implement image picker functionality
  };

  const handleCamera = () => {
    // Implement camera functionality
  };

  const handleEmoji = () => {
    // Implement emoji picker functionality
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={theme.colors.primary} />
        <Appbar.Content 
          title={route.params?.userName || 'Chat'} 
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action icon="video" onPress={() => {}} color={theme.colors.primary} />
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
          renderItem={({ item }) => <ChatMessage message={item} />}
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
});

