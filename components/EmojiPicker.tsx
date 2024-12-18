import React, { useState } from "react";
import { View, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { X } from "lucide-react-native";
import { EmojiCategory } from "../types/chat";

const EMOJI_CATEGORIES: { [key in EmojiCategory]: string[] } = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
  ],
  animals: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
  ],
  foods: [
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
  ],
  activities: [
    "⚽️",
    "🏀",
    "🏈",
    "⚾️",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
  ],
  objects: [
    "⌚️",
    "📱",
    "💻",
    "⌨️",
    "🖥",
    "🖨",
    "🖱",
    "🖲",
    "🕹",
    "🗜",
    "💽",
    "💾",
    "💿",
    "📀",
  ],
  symbols: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
  ],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<EmojiCategory>("smileys");
  const theme = useTheme();

  return (
    <View style={styles.emojiPickerContainer}>
      <View style={styles.emojiPickerHeader}>
        <Text style={styles.emojiPickerTitle}>Choose Emoji</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.emojiCategoryContainer}>
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.selectedCategory,
            ]}
            onPress={() => setSelectedCategory(category as EmojiCategory)}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={EMOJI_CATEGORIES[selectedCategory]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => onEmojiSelect(item)}
          >
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
        numColumns={8}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.emojiList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emojiPickerContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emojiPickerHeader: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emojiCategoryContainer: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
  },
  selectedCategory: {
    backgroundColor: "#E3F2FD",
  },
  categoryText: {
    fontSize: 14,
    color: "#666666",
    textTransform: "capitalize",
  },
  emojiButton: {
    width: `${100 / 8}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  emojiList: {
    padding: 8,
  },
});