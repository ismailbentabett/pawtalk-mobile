import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, AuthStackParamList, AppStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/LoadingScreen';



const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <RootStack.Screen name="App" component={AppNavigator} />
      )}
    </RootStack.Navigator>
  );
}