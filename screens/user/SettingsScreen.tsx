import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, TextInput, Button, Switch, Divider, useTheme, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import {
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

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

interface FormErrors {
  displayName?: string;
  email?: string;
  currentPassword?: string;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [matchEmails, setMatchEmails] = useState(false);
  const [messageEmails, setMessageEmails] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [originalEmail, setOriginalEmail] = useState('');
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigation.navigate('Login' as never);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        setUserData(data);
        setDisplayName(data.displayName || '');
        setEmail(data.email || '');
        setOriginalEmail(data.email || '');
        setNotifications(data.settings?.notifications || false);
        setMatchEmails(data.settings?.emailPreferences?.matches || false);
        setMessageEmails(data.settings?.emailPreferences?.messages || false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (email !== originalEmail && !currentPassword) {
      newErrors.currentPassword = 'Password required to change email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // Update email if changed
      if (email !== originalEmail) {
        const credential = EmailAuthProvider.credential(
          originalEmail,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updateEmail(auth.currentUser, email);
      }

      // Update profile
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      });

      // Update Firestore document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName,
        email,
        settings: {
          notifications,
          emailPreferences: {
            matches: matchEmails,
            messages: messageEmails,
          },
        },
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Profile updated successfully');
      setCurrentPassword('');
      setOriginalEmail(email);
      await fetchUserData(); // Refresh user data
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.code === 'auth/requires-recent-login'
          ? 'Please log out and log in again to change your email'
          : 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (
    type: 'notifications' | 'matches' | 'messages',
    value: boolean
  ) => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const newSettings = {
        notifications: type === 'notifications' ? value : notifications,
        emailPreferences: {
          matches: type === 'matches' ? value : matchEmails,
          messages: type === 'messages' ? value : messageEmails,
        },
      };

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        settings: newSettings,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      if (type === 'notifications') setNotifications(value);
      if (type === 'matches') setMatchEmails(value);
      if (type === 'messages') setMessageEmails(value);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Please enter your password to delete your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!currentPassword) {
              setErrors({ currentPassword: 'Password required to delete account' });
              return;
            }

            setLoading(true);
            try {
              const user = auth.currentUser;
              if (!user || !user.email) throw new Error('No user found');

              // Re-authenticate
              const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
              );
              await reauthenticateWithCredential(user, credential);

              // Delete Firestore document
              await updateDoc(doc(db, 'users', user.uid), {
                deletedAt: serverTimestamp(),
                active: false
              });

              // Delete authentication account
              await deleteUser(user);

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                error.code === 'auth/wrong-password'
                  ? 'Incorrect password'
                  : 'Failed to delete account'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!userData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading user data...</Text>
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
          error={!!errors.displayName}
          disabled={loading}
        />
        <HelperText type="error" visible={!!errors.displayName}>
          {errors.displayName}
        </HelperText>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          error={!!errors.email}
          disabled={loading}
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email}
        </HelperText>

        {email !== originalEmail && (
          <>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              error={!!errors.currentPassword}
              disabled={loading}
            />
            <HelperText type="error" visible={!!errors.currentPassword}>
              {errors.currentPassword}
            </HelperText>
          </>
        )}

        <Text style={styles.infoText}>User ID: {userData.uid}</Text>
        <Text style={styles.infoText}>Role: {userData.role}</Text>
        <Text style={styles.infoText}>
          Last Login: {userData.lastLogin?.toDate().toLocaleString()}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <View style={styles.settingItem}>
          <Text>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={(value) => handleSettingsUpdate('notifications', value)}
            disabled={loading}
          />
        </View>
        <View style={styles.settingItem}>
          <Text>Email for New Matches</Text>
          <Switch
            value={matchEmails}
            onValueChange={(value) => handleSettingsUpdate('matches', value)}
            disabled={loading}
          />
        </View>
        <View style={styles.settingItem}>
          <Text>Email for New Messages</Text>
          <Switch
            value={messageEmails}
            onValueChange={(value) => handleSettingsUpdate('messages', value)}
            disabled={loading}
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          style={styles.button}
          loading={loading}
          disabled={loading}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="content-save" size={size} color={color} />
          )}
        >
          Save Changes
        </Button>

        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          style={[styles.button, styles.deleteButton]}
          loading={loading}
          disabled={loading}
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
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
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