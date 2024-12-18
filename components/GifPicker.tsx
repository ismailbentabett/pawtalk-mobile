import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { X, Search } from "lucide-react-native";

interface GiphyGif {
  id: string;
  images: {
    original: { url: string };
    fixed_width: { url: string };
  };
}

interface GifPickerProps {
  onGifSelect: (gif: { url: string; preview: string }) => void;
  onClose: () => void;
}

const WINDOW_WIDTH = Dimensions.get("window").width;

export const GifPicker: React.FC<GifPickerProps> = ({
  onGifSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const searchGifs = async (query: string) => {
    if (!process.env.EXPO_GIPHY_API_KEY) {
      setError("GIPHY API key is missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${
          process.env.EXPO_GIPHY_API_KEY
          }&q=${encodeURIComponent(query)}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${process.env.EXPO_GIPHY_API_KEY}&limit=20&rating=g`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(
          `GIPHY API request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (data.meta.status !== 200) {
        throw new Error(data.meta.msg || "Failed to load GIFs");
      }

      setGifs(data.data);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      setError("Failed to load GIFs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => searchGifs(query), 500),
    []
  );

  useEffect(() => {
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

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => searchGifs(searchQuery)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
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

function debounce(func: (...args: any[]) => void, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0084FF",
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  gifColumnWrapper: {
    padding: 8,
    justifyContent: "space-between",
  },
  gifItem: {
    width: (WINDOW_WIDTH - 32) / 2,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  gifPreview: {
    width: "100%",
    height: "100%",
  },
});

export default GifPicker;
