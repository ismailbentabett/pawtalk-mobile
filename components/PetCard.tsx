import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pet } from "../types/Pet";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PetCardProps {
  pet: Pet;
}

export const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImagePress = () => {
    const nextIndex = (currentImageIndex + 1) % pet.images.length;
    setCurrentImageIndex(nextIndex);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleImagePress}>
        <Image
          source={{ uri: pet.images[currentImageIndex] }}
          style={styles.image}
        />
      </TouchableOpacity>
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.9)"]}
        style={styles.gradient}
      >
        <Text style={styles.name}>
          {pet.name}, {pet.age}
        </Text>
        <Text style={styles.breed}>{pet.breed}</Text>
        <Text style={styles.location}>
          {pet.location.city}, {pet.location.country}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 180,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    justifyContent: "flex-end",
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  breed: {
    fontSize: 18,
    color: "white",
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: "white",
  },
});