export interface Match {
    id: string;
    name: string;
    avatar: string;
  }
  
  export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    type: 'text' | 'image' | 'gif';
    content?: string;
  }
  
  export interface Chat {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    lastMessage?: Message;
    unread?: number;
  }
  
  