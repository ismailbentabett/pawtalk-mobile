import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import HomeScreen from "../screens/HomeScreen";
import { AppStackParamList } from "../types/navigation";

const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const { isAuthorized } = useAuth();

  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Home" component={HomeScreen} />
    {/*   <AppStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerRight: () => <LogoutButton />
        }}
      /> */}
  {/*     {isAuthorized(['admin', 'moderator']) && (
        <AppStack.Screen name="Settings" component={SettingsScreen} />
      )} */}
    </AppStack.Navigator>
  );
}