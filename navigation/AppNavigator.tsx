import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { ChatRoomScreen } from "../screens/chat/ChatRoomScreen";
import { AppStackParamList } from "../types/navigation";
import BottomTabNavigator from "./BottomTabNavigator";
import SettingsScreen from "../screens/user/SettingsScreen";

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
      {/* export function ChatRoomScreen({ navigation, route }: Props) { */}

      <AppStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
    </AppStack.Navigator>
  );
}
