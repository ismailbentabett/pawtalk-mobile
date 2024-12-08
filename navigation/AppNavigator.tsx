import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Button } from 'react-native';
import { useAuth } from "../contexts/AuthContext";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from '../screens/user/ProfileScreen';
import { AppStackParamList } from "../types/navigation";

const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { signOut, userData } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Home',
          headerRight: () => (
            <Button
              title="Profile"
              onPress={() => navigation.navigate('Profile')}
            />
          ),
        })}
      />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: userData?.displayName || 'Profile',
          headerRight: () => (
            <Button
              title="Logout"
              onPress={handleLogout}
            />
          ),
        }}
      />
    </AppStack.Navigator>
  );
}

