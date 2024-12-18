import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  View,
} from "react-native";
import { Avatar, Text, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { PetMatch } from "../types/chat";

interface MatchesCarouselProps {
  matches: PetMatch[];
  onMatchPress: (match: PetMatch) => void;
}

export const MatchesCarousel: React.FC<MatchesCarouselProps> = ({
  matches,
  onMatchPress,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.matchesContainer, { opacity: fadeAnim }]}>
      <Text style={[styles.matchesTitle, { color: theme.colors.primary }]}>
        New Matches
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {matches.map((match, index) => (
          <Animated.View
            key={match.id}
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50 * (index + 1), 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.matchItem}
              onPress={() => onMatchPress(match)}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.accent]}
                style={styles.avatarGradient}
              >
                <Avatar.Image size={70} source={{ uri: match.avatar }} />
              </LinearGradient>
              <Text style={styles.matchName} numberOfLines={1}>
                {match.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  matchesContainer: {
    padding: 16,
    marginBottom: 8,
  },
  matchesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  matchItem: {
    alignItems: "center",
    marginRight: 16,
  },
  avatarGradient: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
  },
  matchName: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 80,
  },
});
