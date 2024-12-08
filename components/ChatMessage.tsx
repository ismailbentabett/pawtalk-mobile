import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  type: 'text' | 'image' | 'gif';
  content?: string;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.otherContainer]}>
      <Surface style={[styles.bubble, isUser ? styles.userBubble : styles.otherBubble]}>
        {message.type === 'text' && (
          <Text style={[styles.text, isUser ? styles.userText : styles.otherText]}>
            {message.text}
          </Text>
        )}
        {(message.type === 'image' || message.type === 'gif') && message.content && (
          <Image source={{ uri: message.content }} style={styles.media} resizeMode="cover" />
        )}
      </Surface>
      <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>
        {format(message.timestamp, 'HH:mm')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#F0F0F0',
  },
  text: {
    fontSize: 16,
  },
  userText: {
    color: 'white',
  },
  otherText: {
    color: 'black',
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#8E8E93',
    alignSelf: 'flex-end',
  },
  otherTimestamp: {
    color: '#8E8E93',
    alignSelf: 'flex-start',
  },
});

