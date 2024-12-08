import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Button } from 'react-native';
import { useAuth } from "../contexts/AuthContext";
import { AppStackParamList } from "../types/navigation";
import BottomTabNavigator from './BottomTabNavigator';

const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="Main"
        component={BottomTabNavigator}
        options={{
          headerShown: false,
        }}
      />
    </AppStack.Navigator>
  );
}

