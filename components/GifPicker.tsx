import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { X, Search } from "lucide-react-native";
import { GiphyGif } from "../types/chat";

const GIPHY_API_KEY = process.env.EXPO_GIPHY_API_KEY;
const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";

interface GifPickerProps {
  onGifSelect: (gif: { url: string; preview: string }) => void;
  onClose: () => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({
  onGifSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query
        ? `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
            query
          )}&limit=20&rating=g`
        : `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.meta.status === 200) {
        setGifs(data.data);
      } else {
        throw new Error(data.meta.msg);
      }
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      alert("Failed to load GIFs");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => searchGifs(query), 500),
    []
  );

  React.useEffect(() => {
    searchGifs("");
  }, []);

  return (
    <View style={styles.gifPickerContainer}>
      <View style={styles.gifPickerHeader}>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search GIFs..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              debouncedSearch(text);
            }}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.gifLoader}
          size="large"
          color={theme.colors.primary}
        />
      ) : (
        <FlatList
          data={gifs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gifItem}
              onPress={() =>
                onGifSelect({
                  url: item.images.original.url,
                  preview: item.images.fixed_width.url,
                })
              }
            >
              <Image
                source={{ uri: item.images.fixed_width.url }}
                style={styles.gifPreview}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          numColumns={2}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.gifColumnWrapper}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gifPickerContainer: {
    height: 400,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gifPickerHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#000000",
    fontSize: 16,
  },
  gifLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gifItem: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  gifPreview: {
    width: "100%",
    aspectRatio: 1,
  },
  gifColumnWrapper: {
    padding: 4,
  },
});

function debounce(func: (...args: any[]) => void, delay: number) {
  let timer: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
