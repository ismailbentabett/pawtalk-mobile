import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { GifPicker } from "./GifPicker";

interface MediaPickerProps {
  onClose: () => void;
  onImageSelect: (path: string) => void;
  onGifSelect: (gif: { url: string; preview: string }) => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  onClose,
  onImageSelect,
  onGifSelect,
}) => {
  const [showGifPicker, setShowGifPicker] = useState(false);
  const theme = useTheme();

  const handleImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photos to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error("Image picker error:", error);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your camera to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image");
      console.error("Camera error:", error);
    }
  };

  if (showGifPicker) {
    return (
      <GifPicker
        onGifSelect={onGifSelect}
        onClose={() => setShowGifPicker(false)}
      />
    );
  }

  return (
    <View style={styles.mediaPickerContainer}>
      <View style={styles.mediaPickerHeader}>
        <Text style={styles.mediaPickerTitle}>Share Media</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaOptions}>
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={handleCameraCapture}
          >
            <Camera size={32} color={theme.colors.onSurface} />
            <Text style={styles.mediaOptionText}>Camera</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.mediaOption} onPress={handleImagePick}>
          <ImageIcon size={32} color={theme.colors.onSurface} />
          <Text style={styles.mediaOptionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mediaOption}
          onPress={() => setShowGifPicker(true)}
        >
          <Text style={styles.gifIcon}>GIF</Text>
          <Text style={styles.mediaOptionText}>GIF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mediaPickerContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mediaPickerHeader: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  mediaPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mediaOptions: {
    flexDirection: "row",
    justifyContent: Platform.OS === "web" ? "center" : "space-around",
    padding: 20,
    gap: Platform.OS === "web" ? 40 : 0,
  },
  mediaOption: {
    alignItems: "center",
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 14,
  },
  gifIcon: {
    fontSize: 32,
    fontWeight: "bold",
  },
});