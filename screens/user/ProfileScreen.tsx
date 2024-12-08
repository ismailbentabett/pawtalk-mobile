// screens/ProfileScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Text, Card, List, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { userData, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>No profile data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={100}
            source={{ uri: userData.photoURL || 'https://placekitten.com/200/200' }}
          />
          <Text style={styles.name} variant="headlineMedium">
            {userData.displayName || 'User'}
          </Text>
        </View>

        <Card.Content style={styles.content}>
          <List.Section>
            <List.Item
              title="Email"
              description={userData.email || 'No email'}
              left={props => <List.Icon {...props} icon="email" />}
            />
            <List.Item
              title="Role"
              description={userData.role || 'User'}
              left={props => <List.Icon {...props} icon="badge-account" />}
            />
          </List.Section>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    padding: 20,
  },
  name: {
    marginTop: 12,
  },
  content: {
    paddingTop: 16,
  },
  logoutButton: {
    marginTop: 24,
  },
});