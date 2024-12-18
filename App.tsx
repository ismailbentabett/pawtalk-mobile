import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { PetProvider } from './contexts/PetContext';
import { ChatProvider } from './contexts/ChatContext';
import RootNavigator from './navigation';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#000000',
    secondary: '#FFFFFF',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#000000',
    outline: '#E0E0E0',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <PetProvider>
            <ChatProvider>
              <RootNavigator />
            </ChatProvider>
          </PetProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

