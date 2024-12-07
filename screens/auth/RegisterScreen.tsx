import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  HelperText
} from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from '../../config/firebase';

export default function RegisterScreen({ navigation }: { navigation: NavigationProp<any> }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        setError('');
        const { success, error } = await createUserWithEmailAndPassword(
          formData.email,
          formData.password,
          formData.name
        );

        if (success) {
          // Auth context will handle navigation
        } else {
          setError(error || 'Registration failed');
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
          Create Account
        </Text>

        <View style={styles.form}>
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <TextInput
            mode="outlined"
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => {
              setFormData(prev => ({...prev, name: text}));
              if (errors.name) setErrors(prev => ({...prev, name: ''}));
            }}
            left={<TextInput.Icon icon="account" />}
            error={!!errors.name}
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Email"
            value={formData.email}
            onChangeText={(text) => {
              setFormData(prev => ({...prev, email: text}));
              if (errors.email) setErrors(prev => ({...prev, email: ''}));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            error={!!errors.email}
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Password"
            value={formData.password}
            onChangeText={(text) => {
              setFormData(prev => ({...prev, password: text}));
              if (errors.password) setErrors(prev => ({...prev, password: ''}));
            }}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            error={!!errors.password}
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => {
              setFormData(prev => ({...prev, confirmPassword: text}));
              if (errors.confirmPassword) 
                setErrors(prev => ({...prev, confirmPassword: ''}));
            }}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            error={!!errors.confirmPassword}
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading || !formData.email || !formData.password || !formData.name}
          >
            Create Account
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.textButton}
            disabled={loading}
          >
            Already have an account? Sign In
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