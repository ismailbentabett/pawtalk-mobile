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
import { GiphyGif } from "../types/chat";

const WINDOW_WIDTH = Dimensions.get("window").width;
const GIPHY_API_KEY = process.env.EXPO_GIPHY_API_KEY;


console.log("GIPHY_API_KEY", GIPHY_API_KEY);

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const theme = useTheme();

  const searchGifs = async (
    query: string,
    pageOffset: number = 0,
    append: boolean = false
  ) => {
    if (!GIPHY_API_KEY) {
      setError("GIPHY API key is not configured");
      return;
    }

    if (pageOffset === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const limit = 20;
      const offset = pageOffset * limit;

      const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
            query
          )}&limit=${limit}&offset=${offset}&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;

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

      const newGifs = data.data.map((gif: any) => ({
        id: gif.id,
        images: {
          original: { url: gif.images.original.url },
          fixed_width: { url: gif.images.fixed_width.url },
        },
      }));

      if (append) {
        setGifs((prev) => [...prev, ...newGifs]);
      } else {
        setGifs(newGifs);
      }

      setHasMore(newGifs.length === limit);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      setError("Failed to load GIFs. Please try again.");
      Alert.alert("Error", "Failed to load GIFs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(0);
      searchGifs(query, 0, false);
    }, 500),
    []
  );

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      searchGifs(searchQuery, nextPage, true);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    searchGifs(searchQuery, 0, false);
  };

  useEffect(() => {
    searchGifs("", 0, false);
  }, []);

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.gifPickerContainer}>
      <View style={styles.gifPickerHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
              activeOpacity={0.7}
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
          contentContainerStyle={styles.gifList}
          columnWrapperStyle={styles.gifColumnWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshing={loading && page === 0}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No GIFs found</Text>
              </View>
            )
          }
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
  closeButton: {
    padding: 8,
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
  gifList: {
    padding: 8,
  },
  gifColumnWrapper: {
    justifyContent: "space-between",
  },
  gifItem: {
    width: (WINDOW_WIDTH - 32) / 2,
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  gifPreview: {
    width: "100%",
    height: (WINDOW_WIDTH - 32) / 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
  },
  loaderFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default GifPicker;
