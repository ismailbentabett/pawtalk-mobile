import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { signInWithEmailAndPassword } from '../../config/firebase';

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/navigation";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function  LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('xisben2001x@gmail.com');
  const [password, setPassword] = useState('xisben2001x@gmail.com');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (text: string) => {
    setEmail(text);
    if (!text.includes('@')) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  const handleLogin = async () => {
    if (!emailError && email && password) {
      try {
        setLoading(true);
        setError('');
        const { success, error } = await signInWithEmailAndPassword(email, password);
        
        console.log('Registration result:', { success, error });

        if (success) {
          // Auth context will handle navigation
          console.log('Registration successful');
          
        } else {
          setError(error || 'Login failed');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Surface style={styles.surface} elevation={1}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome Back
        </Text>

        <View style={styles.form}>
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={validateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
            disabled={loading || !email || !password || !!emailError}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.textButton}
            disabled={loading}
          >
            Don't have an account? Sign Up
          </Button>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    surface: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    title: {
      textAlign: 'center',
      marginBottom: 20,
    },
    form: {
      gap: 10,
    },
    input: {
      backgroundColor: '#fff',
    },
    button: {
      marginTop: 20,
      padding: 4,
    },
    textButton: {
      marginTop: 10,
    },
  });
  