import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigator from './navigation';


const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
  },
};

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}