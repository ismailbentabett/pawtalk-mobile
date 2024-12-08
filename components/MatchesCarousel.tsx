import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import type { Match } from '../types/chat';

interface MatchesCarouselProps {
  matches: Match[];
  onMatchPress: (match: Match) => void;
}

export function MatchesCarousel({ matches, onMatchPress }: MatchesCarouselProps) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>New Matches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {matches.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchItem}
            onPress={() => onMatchPress(match)}
          >
            <Avatar.Image
              size={80}
              source={{ uri: match.avatar }}
              style={styles.avatar}
            />
            <Text variant="labelMedium" style={styles.name}>{match.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginLeft: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  scrollView: {
    paddingHorizontal: 12,
  },
  matchItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 84,
  },
  avatar: {
    borderRadius: 40,
    marginBottom: 4,
  },
  name: {
    textAlign: 'center',
  },
});

