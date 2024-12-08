// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigator from './navigation';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#000000', // Neutral Black
    secondary: '#FFFFFF', // Neutral White
    background: '#F5F5F5', // Soft White/Light Gray for backgrounds
    surface: '#FFFFFF', // White for surfaces like cards
    text: '#000000', // Black for text
    onPrimary: '#FFFFFF', // White text on black primary backgrounds
    onSecondary: '#000000', // Black text on white secondary backgrounds
    onSurface: '#000000', // Black text on surfaces
    outline: '#E0E0E0', // Light Gray for outlines or borders
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
