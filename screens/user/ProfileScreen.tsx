import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Avatar, Text, Button, useTheme, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";

export type UserRole = "admin" | "moderator" | "user";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  profileImage?: string;
  settings: {
    notifications: boolean;
    emailPreferences: {
      matches: boolean;
      messages: boolean;
    };
  };
}

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const { userData, signOut } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("info");
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      // TODO: Implement error handling, e.g., show a toast message
    }
  };

  const handleNavigateToSettings = () => {
    navigation.navigate("Settings" as never);
  };

  const toggleSetting = (setting: string) => {
    // This is a placeholder function. In a real app, you would update the user's settings here.
    console.log(`Toggling setting: ${setting}`);
  };

  const renderUserInfo = (user: User) => (
    <View style={styles.infoContainer}>
      <Text style={styles.sectionTitle}>User Details</Text>
      <View style={styles.infoItem}>
        <MaterialCommunityIcons
          name="email"
          size={24}
          color={theme.colors.onSurface}
        />
        <Text style={styles.infoText}>{user.email || "No email provided"}</Text>
      </View>
      {/*   <View style={styles.infoItem}>
        <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.onSurface} />
        <Text style={styles.infoText}>
          {user.createdAt ? `Joined ${user.createdAt.toDate().toLocaleDateString()}` : 'Join date unknown'}
        </Text>
      </View> */}
      <View style={styles.infoItem}>
        <MaterialCommunityIcons
          name="clock"
          size={24}
          color={theme.colors.onSurface}
        />
        <Text style={styles.infoText}>
          {user.lastLogin
            ? `Last login ${user.lastLogin.toDate().toLocaleString()}`
            : "Last login unknown"}
        </Text>
      </View>
    </View>
  );

  const renderSettingsInfo = (user: User) => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.settingItem}>
        <MaterialCommunityIcons
          name={user.settings?.notifications ? "bell" : "bell-off"}
          size={24}
          color={theme.colors.onSurface}
        />
        <Text style={styles.settingText}>Notifications</Text>
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => toggleSetting("notifications")}
        >
          <Animated.View
            style={[
              styles.toggleOption,
              {
                transform: [
                  { translateX: user.settings?.notifications ? 40 : 0 },
                ],
              },
            ]}
          />
          <Text
            style={[
              styles.toggleText,
              !user.settings?.notifications && styles.activeToggleText,
            ]}
          >
            Off
          </Text>
          <Text
            style={[
              styles.toggleText,
              user.settings?.notifications && styles.activeToggleText,
            ]}
          >
            On
          </Text>
        </TouchableOpacity>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.settingItem}>
        <MaterialCommunityIcons
          name={user.settings?.emailPreferences.matches ? "email" : "email-off"}
          size={24}
          color={theme.colors.onSurface}
        />
        <Text style={styles.settingText}>Match Emails</Text>
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => toggleSetting("matchEmails")}
        >
          <Animated.View
            style={[
              styles.toggleOption,
              {
                transform: [
                  {
                    translateX: user.settings?.emailPreferences.matches
                      ? 40
                      : 0,
                  },
                ],
              },
            ]}
          />
          <Text
            style={[
              styles.toggleText,
              !user.settings?.emailPreferences.matches &&
                styles.activeToggleText,
            ]}
          >
            Off
          </Text>
          <Text
            style={[
              styles.toggleText,
              user.settings?.emailPreferences.matches &&
                styles.activeToggleText,
            ]}
          >
            On
          </Text>
        </TouchableOpacity>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.settingItem}>
        <MaterialCommunityIcons
          name={
            user.settings?.emailPreferences.messages ? "message" : "message-off"
          }
          size={24}
          color={theme.colors.onSurface}
        />
        <Text style={styles.settingText}>Message Emails</Text>
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => toggleSetting("messageEmails")}
        >
          <Animated.View
            style={[
              styles.toggleOption,
              {
                transform: [
                  {
                    translateX: user.settings?.emailPreferences.messages
                      ? 40
                      : 0,
                  },
                ],
              },
            ]}
          />
          <Text
            style={[
              styles.toggleText,
              !user.settings?.emailPreferences.messages &&
                styles.activeToggleText,
            ]}
          >
            Off
          </Text>
          <Text
            style={[
              styles.toggleText,
              user.settings?.emailPreferences.messages &&
                styles.activeToggleText,
            ]}
          >
            On
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!userData) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text>No profile data available. Please log in.</Text>
      </View>
    );
  }

  const user = userData as User;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [height * 0.2, height * 0.1],
    extrapolate: "clamp",
  });

  const avatarSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 40],
    extrapolate: "clamp",
  });

  const nameOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={["#000", "#333"]}
          style={StyleSheet.absoluteFill}
        >
          <BlurView intensity={100} style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[styles.avatarContainer, { opacity: nameOpacity }]}
            >
              <Animated.View style={{ width: avatarSize, height: avatarSize }}>
                <Avatar.Image
                  size={80}
                  source={{
                    uri: user.profileImage || "https://placekitten.com/200/200",
                  }}
                  style={styles.avatar}
                />
              </Animated.View>
              <Animated.Text
                style={[styles.name, { opacity: nameOpacity }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user.displayName || "Anonymous User"}
              </Animated.Text>
              <Animated.View
                style={[styles.roleContainer, { opacity: nameOpacity }]}
              >
                <Text style={styles.role}>
                  {user.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "No Role"}
                </Text>
              </Animated.View>
            </Animated.View>
          </BlurView>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {}
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "info" && styles.activeTab]}
              onPress={() => setActiveTab("info")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "info" && styles.activeTabText,
                ]}
              >
                Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "settings" && styles.activeTab]}
              onPress={() => setActiveTab("settings")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "settings" && styles.activeTabText,
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "info"
            ? renderUserInfo(user)
            : renderSettingsInfo(user)}

          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={handleNavigateToSettings}
              style={styles.settingsButton}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="cog" size={size} color={color} />
              )}
            >
              Edit Settings
            </Button>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="logout"
                  size={size}
                  color={color}
                />
              )}
            >
              Logout
            </Button>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: height * 0.2,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  avatar: {
    borderWidth: 2,
    borderColor: "white",
  },
  name: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  roleContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
  },
  role: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#000",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  infoContainer: {
    marginBottom: 16,
  },
  settingsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  settingText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
    color: "#333",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 2,
    width: 80,
    height: 26,
  },
  toggleOption: {
    position: "absolute",
    width: 38,
    height: 22,
    backgroundColor: "#000",
    borderRadius: 10,
  },
  toggleText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  activeToggleText: {
    color: "#000",
  },
  divider: {
    marginVertical: 8,
  },
  actionsContainer: {
    marginTop: 16,
  },
  settingsButton: {
    marginBottom: 8,
    backgroundColor: "#000",
  },
  logoutButton: {
    borderColor: "#000",
  },
});
