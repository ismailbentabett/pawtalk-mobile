import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import ProfileScreen from "../screens/user/ProfileScreen";
import { BottomTabParamList } from "../types/navigation";
import { ChatsScreen } from "../screens/chat/ChatsScreen";
import { HomeScreen } from "../screens/HomeScreen";

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "dashboard" : "dashboard-customize";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }
          else if (route.name === "Chats") {
            iconName = focused ? "chat" : "chat-bubble-outline";
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarLabel: "My Profile",
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          title: "Chats",
          tabBarLabel: "Chats",
        }}
      />
    </Tab.Navigator>
  );
}
