import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
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
  const [processing, setProcessing] = useState(false);
  const theme = useTheme();

  const processImage = async (uri: string): Promise<string> => {
    try {
      setProcessing(true);

      // Process image with fixed dimensions
      const processed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // This maintains aspect ratio
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return processed.uri;
    } catch (error) {
      console.error("Image processing error:", error);
      throw new Error("Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const checkAndRequestPermissions = async (
    permissionType: "camera" | "mediaLibrary"
  ): Promise<boolean> => {
    try {
      const permissionRequest =
        permissionType === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionRequest.granted) {
        Alert.alert(
          "Permission needed",
          `Please allow access to your ${
            permissionType === "camera" ? "camera" : "photos"
          } to ${
            permissionType === "camera" ? "take photos" : "select images"
          }.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Settings",
              onPress: () =>
                Platform.OS === "ios"
                  ? Linking.openURL("app-settings:")
                  : Linking.openSettings(),
            },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return false;
    }
  };

  const handleImagePick = async () => {
    try {
      const hasPermission = await checkAndRequestPermissions("mediaLibrary");
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const processedUri = await processImage(result.assets[0].uri);
        onImageSelect(processedUri);
        onClose();
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert(
        "Error",
        "Failed to pick image. Please try again or choose a different image."
      );
    }
  };

  const handleCameraCapture = async () => {
    try {
      const hasPermission = await checkAndRequestPermissions("camera");
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const processedUri = await processImage(result.assets[0].uri);
        onImageSelect(processedUri);
        onClose();
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
    }
  };

  if (showGifPicker) {
    return (
      <GifPicker
        onGifSelect={(gif) => {
          onGifSelect(gif);
          onClose();
        }}
        onClose={() => setShowGifPicker(false)}
      />
    );
  }

  if (processing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.processingText}>Processing image...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaPickerContainer}>
      <View style={styles.mediaPickerHeader}>
        <Text style={styles.mediaPickerTitle}>Share Media</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaOptions}>
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={handleCameraCapture}
            activeOpacity={0.7}
          >
            <Camera size={32} color={theme.colors.onSurface} />
            <Text style={styles.mediaOptionText}>Camera</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.mediaOption}
          onPress={handleImagePick}
          activeOpacity={0.7}
        >
          <ImageIcon size={32} color={theme.colors.onSurface} />
          <Text style={styles.mediaOptionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mediaOption}
          onPress={() => setShowGifPicker(true)}
          activeOpacity={0.7}
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
  closeButton: {
    padding: 8,
  },
  mediaOptions: {
    flexDirection: "row",
    justifyContent: Platform.OS === "web" ? "center" : "space-around",
    padding: 20,
    gap: Platform.OS === "web" ? 40 : 0,
  },
  mediaOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#000000",
  },
  gifIcon: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  processingContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
});
