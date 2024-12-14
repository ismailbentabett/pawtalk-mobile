import React, { useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Surface,
  HelperText,
} from "react-native-paper";
import { NavigationProp } from "@react-navigation/native";
import { useAuthContext } from "../../contexts/AuthContext";

export default function RegisterScreen({
  navigation,
}: {
  navigation: NavigationProp<any>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { signUp, loading } = useAuthContext();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (name && email && password) {
      setError("");
      const { success, error } = await signUp(email, password, name);

      if (success) {
        console.log("Registration successful");
      } else {
        setError(error || "Registration failed");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            value={name}
            onChangeText={setName}
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={
              loading || !name || !email || !password || !confirmPassword
            }
          >
            Create Account
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate("Login")}
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
    backgroundColor: "#fff",
  },
  surface: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  form: {
    gap: 10,
  },
  input: {
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 20,
    padding: 4,
  },
  textButton: {
    marginTop: 10,
  },
});
