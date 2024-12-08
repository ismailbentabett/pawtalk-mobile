import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Text, TextInput, Button, Switch, Divider, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Timestamp } from "firebase/firestore";

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

export default function SettingsScreen() {
  const { userData, updateUserProfile, deleteAccount, signOut } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (userData) {
      setUser(userData as User);
    }
  }, [userData]);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [matchEmails, setMatchEmails] = useState(false);
  const [messageEmails, setMessageEmails] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setNotifications(user.settings?.notifications || false);
      setMatchEmails(user.settings?.emailPreferences?.matches || false);
      setMessageEmails(user.settings?.emailPreferences?.messages || false);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not available. Please log in again.');
      return;
    }

    try {
      const updatedUser: Partial<User> = {
        displayName: displayName || undefined,
        email: email || undefined,
        settings: {
          notifications,
          emailPreferences: {
            matches: matchEmails,
            messages: messageEmails,
          },
        },
      };
      await updateUserProfile(updatedUser);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>No user data available. Please log in again.</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Login' as never)} style={styles.button}>
          Go to Login
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <TextInput
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
        />
        <Text style={styles.infoText}>User ID: {user.uid ?? 'N/A'}</Text>
        <Text style={styles.infoText}>Role: {user.role ?? 'N/A'}</Text>
   {/*      <Text style={styles.infoText}>
          Created At: {user.createdAt ? user.createdAt.toDate().toLocaleString() : 'N/A'}
        </Text> */}
        <Text style={styles.infoText}>
          Last Login: {user.lastLogin ? user.lastLogin.toDate().toLocaleString() : 'N/A'}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <View style={styles.settingItem}>
          <Text>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <View style={styles.settingItem}>
          <Text>Email for New Matches</Text>
          <Switch value={matchEmails} onValueChange={setMatchEmails} />
        </View>
        <View style={styles.settingItem}>
          <Text>Email for New Messages</Text>
          <Switch value={messageEmails} onValueChange={setMessageEmails} />
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        {user.profileImage ? (
          <Text style={styles.infoText}>Profile picture set</Text>
        ) : (
          <Text style={styles.infoText}>No profile picture set</Text>
        )}
        <Button
          mode="outlined"
          onPress={() => {
            // Implement profile picture upload functionality
            Alert.alert('Info', 'Profile picture upload functionality to be implemented');
          }}
          style={styles.button}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="camera" size={size} color={color} />
          )}
        >
          Update Profile Picture
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          style={styles.button}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="content-save" size={size} color={color} />
          )}
        >
          Save Changes
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="arrow-left" size={size} color={color} />
          )}
        >
          Back to Profile
        </Button>
        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          style={[styles.button, styles.deleteButton]}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="delete" size={size} color={color} />
          )}
        >
          Delete Account
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  input: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  button: {
    marginBottom: 16,
  },
  deleteButton: {
    borderColor: 'red',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

