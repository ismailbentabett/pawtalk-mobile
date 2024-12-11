import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Text,
  Vibration,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Swiper from "react-native-deck-swiper";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { Pet } from "../types/Pet";
import { Match, MatchStatus } from "../types/Match";
import { Message } from "../types/chat";
import { Conversation, ConversationStatus } from "../types/Conversation";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

interface MatchOperation {
  match: Match;
  conversationId: string;
}

export default function HomeScreen() {
  // State management
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const bioAnimation = useRef(new Animated.Value(0)).current;

  // Helper functions
  const getImageArray = (pet: Pet): string[] => {
    const images: string[] = [];
    if (pet.images?.main) images.push(pet.images.main);
    if (pet.images?.additional?.length) images.push(...pet.images.additional);
    return images;
  };

  // Fetch pets
  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get already matched pets
      const matchesQuery = query(
        collection(db, "matches"),
        where("userId", "==", userId)
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchedPetIds = matchesSnapshot.docs.map((doc) => doc.data().petId);

      // Query for available pets
      const petsQuery =
        matchedPetIds.length > 0
          ? query(
              collection(db, "pets"),
              where("status", "==", "available"),
              where("id", "not-in", matchedPetIds),
              limit(10)
            )
          : query(
              collection(db, "pets"),
              where("status", "==", "available"),
              limit(10)
            );

      const querySnapshot = await getDocs(petsQuery);
      const fetchedPets = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Pet[];

      setPets(fetchedPets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      setError(error instanceof Error ? error.message : "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPets();
  }, []);

  // Create initial message when matched
  const createInitialMessage = async (
    conversationId: string,
    petId: string,
    petName: string
  ): Promise<void> => {
    const messageRef = doc(collection(db, "messages"));
    const message: Message = {
      id: messageRef.id,
      senderId: petId,
      content: `Woof! I'm ${petName}! Thanks for matching with me! 🐾`,
      createdAt: serverTimestamp() as Timestamp,
      read: false,
      type: "text",
      conversationId,
    };

    await setDoc(messageRef, message);
  };

  // Create conversation between user and pet
  const createConversation = async (
    userId: string,
    pet: Pet
  ): Promise<string> => {
    const conversationRef = doc(collection(db, "conversations"));
    const conversation: Conversation = {
      id: conversationRef.id,
      participants: [userId, pet.id],
      petId: pet.id,
      createdAt: serverTimestamp() as Timestamp,
      lastMessageAt: serverTimestamp() as Timestamp,
      status: "active" as ConversationStatus,
      userId: userId,
    };

    await setDoc(conversationRef, conversation);
    await createInitialMessage(conversationRef.id, pet.id, pet.name);
    return conversationRef.id;
  };

  // Handle match creation
  const createMatch = async (): Promise<MatchOperation> => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid || currentIndex >= pets.length) {
      throw new Error("User not authenticated or no pets available");
    }

    try {
      const currentPet = pets[currentIndex];

      // Check for existing match
      const existingMatchQuery = query(
        collection(db, "matches"),
        where("userId", "==", currentUser.uid),
        where("petId", "==", currentPet.id)
      );
      const existingMatchSnapshot = await getDocs(existingMatchQuery);

      if (!existingMatchSnapshot.empty) {
        // Match already exists, return existing match data
        const existingMatch = existingMatchSnapshot.docs[0].data() as Match;
        const existingConversationQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", currentUser.uid),
          where("petId", "==", currentPet.id)
        );
        const existingConversationSnapshot = await getDocs(
          existingConversationQuery
        );

        if (existingConversationSnapshot.empty) {
          throw new Error("Existing match found but no conversation exists");
        }

        return {
          match: existingMatch,
          conversationId: existingConversationSnapshot.docs[0].id,
        };
      }

      // Create new match
      const matchRef = doc(collection(db, "matches"));
      const match: Match = {
        id: matchRef.id,
        userId: currentUser.uid,
        petId: currentPet.id,
        status: "matched",
        createdAt: serverTimestamp() as Timestamp,
        matchedAt: serverTimestamp() as Timestamp,
      };

      // Create conversation
      const conversationId = await createConversation(
        currentUser.uid,
        currentPet
      );

      await Promise.all([
        setDoc(matchRef, match),
        updateDoc(doc(db, "pets", currentPet.id), {
          matches: arrayUnion(currentUser.uid),
          matchRate: increment(0.1),
          lastActivity: serverTimestamp(),
        }),
        updateDoc(doc(db, "users", currentUser.uid), {
          "settings.lastMatch": serverTimestamp(),
        }),
      ]);

      return { match, conversationId };
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  };

  // Action handlers
  const handleMatch = useCallback(async () => {
    if (currentIndex >= pets.length) return;
    try {
      Vibration.vibrate(50);
      const result = await createMatch();
      console.log("Match created:", result.match.id);
      console.log("Conversation created:", result.conversationId);
      setMatchAnimation(true);
      setTimeout(() => setMatchAnimation(false), 1500);
      setLastAction("matched");
    } catch (err) {
      setError("Failed to create match");
    }
  }, [currentIndex, pets.length]);

  const handleNope = useCallback(async () => {
    if (currentIndex >= pets.length) return;
    try {
      Vibration.vibrate(50);
      setLastAction("noped");
    } catch (err) {
      setError("Failed to pass pet");
    }
  }, [currentIndex, pets.length]);

  const handleImagePress = useCallback(() => {
    if (pets[currentIndex]) {
      const images = getImageArray(pets[currentIndex]);
      if (images.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    }
  }, [currentIndex, pets]);

  const handleRefresh = useCallback(async () => {
    Vibration.vibrate(30);
    setCurrentIndex(0);
    setCurrentImageIndex(0);
    await fetchPets();
  }, []);

  // UI helpers
  const toggleBio = useCallback(() => {
    setShowBio((prev) => !prev);
    Animated.timing(bioAnimation, {
      toValue: showBio ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBio]);

  const renderCarouselIndicators = useCallback(() => {
    if (!pets[currentIndex]) return null;
    const images = getImageArray(pets[currentIndex]);

    return (
      <View style={styles.carouselIndicators}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.carouselIndicator,
              index === currentImageIndex && styles.carouselIndicatorActive,
            ]}
          />
        ))}
      </View>
    );
  }, [currentIndex, currentImageIndex, pets]);

  const renderCard = (pet: Pet) => {
    const images = getImageArray(pet);

    return (
      <Animated.View style={[styles.animatedCard, { opacity }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleImagePress}>
          <Image
            style={styles.cardImage}
            source={{ uri: images[currentImageIndex] }}
            resizeMode="cover"
          />
          {renderCarouselIndicators()}
        </TouchableOpacity>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.cardGradient}
        >
          <Text style={styles.cardName}>
            {pet.name}, {pet.age}
          </Text>
          <Text style={styles.cardSpecies}>
            {pet.breed} · {pet.type}
          </Text>
          <Text style={styles.cardLocation}>
            {pet.location.city}, {pet.location.country}
          </Text>
          <View style={styles.cardDetails}>
            <Text style={styles.cardDetailText}>
              {pet.gender} · {pet.vaccinated ? "Vaccinated" : "Not Vaccinated"}
            </Text>
          </View>
        </LinearGradient>

        <TouchableOpacity style={styles.bioButton} onPress={toggleBio}>
          <IconButton icon="information" size={24} iconColor="white" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.bioContainer,
            {
              transform: [
                {
                  translateY: bioAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <BlurView intensity={100} style={styles.bioBlurView}>
            <ScrollView>
              <Text style={styles.bioText}>{pet.description}</Text>
              <View style={styles.bioInfoSection}>
                <Text style={styles.bioInfoTitle}>Health Information</Text>
                <Text style={styles.bioInfoText}>
                  Microchipped: {pet.microchipped ? "Yes" : "No"}
                </Text>
                <Text style={styles.bioInfoText}>
                  Neutered: {pet.neutered ? "Yes" : "No"}
                </Text>
                <Text style={styles.bioInfoText}>
                  Vaccinated: {pet.vaccinated ? "Yes" : "No"}
                </Text>
              </View>
              <View style={styles.bioInfoSection}>
                <Text style={styles.bioInfoTitle}>Additional Details</Text>
                <Text style={styles.bioInfoText}>
                  Adoption Fee: ${pet.adoptionFee}
                </Text>
                <Text style={styles.bioInfoText}>
                  Location: {pet.location.city}, {pet.location.state},{" "}
                  {pet.location.country}
                </Text>
                <Text style={styles.bioInfoText}>Status: {pet.status}</Text>
                <Text style={styles.bioInfoText}>
                  Added: {pet.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </ScrollView>
          </BlurView>
        </Animated.View>
      </Animated.View>
    );
  };

  // Main render conditions
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Fetching pets...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (pets.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pets available at the moment.</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentIndex >= pets.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No more pets to show.</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <Swiper
        cards={pets}
        renderCard={renderCard}
        onSwipedLeft={handleNope}
        onSwipedRight={handleMatch}
        onSwipedTop={handleMatch}
        onSwipedAll={() => setCurrentIndex(pets.length)}
        cardIndex={currentIndex}
        backgroundColor={"#f5f5f5"}
        stackSize={3}
        stackSeparation={15}
        containerStyle={styles.swiperContainer}
        cardStyle={styles.swiperCard}
        animateOverlayLabelsOpacity
        animateCardOpacity
        swipeBackCard
        overlayLabels={{
          left: {
            title: "NOPE",
            style: {
              label: {
                backgroundColor: "transparent",
                borderColor: "#EC5E6F",
                color: "#EC5E6F",
                borderWidth: 4,
                fontSize: 36,
                fontWeight: "800",
                padding: 12,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "flex-start",
                marginTop: 60,
                marginLeft: -30,
              },
            },
          },
          right: {
            title: "MATCH",
            style: {
              label: {
                backgroundColor: "transparent",
                borderColor: "#4CCC93",
                color: "#4CCC93",
                borderWidth: 4,
                fontSize: 36,
                fontWeight: "800",
                padding: 12,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                marginTop: 60,
                marginLeft: 30,
              },
            },
          },
          top: {
            title: "SUPER MATCH",
            style: {
              label: {
                backgroundColor: "transparent",
                borderColor: "#3AB4CC",
                color: "#3AB4CC",
                borderWidth: 4,
                fontSize: 24,
                fontWeight: "800",
                padding: 12,
              },
              wrapper: {
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              },
            },
          },
        }}
      />
    );
  };

  // Main return
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>{renderContent()}</View>

      {!loading && pets.length > 0 && currentIndex < pets.length && (
        <View style={styles.bottomContainer}>
          <IconButton
            icon="refresh"
            size={30}
            iconColor="#FBD88B"
            style={[styles.button, styles.smallButton]}
            onPress={handleRefresh}
          />
          <IconButton
            icon="close"
            size={40}
            iconColor="#EC5E6F"
            style={[styles.button, styles.largeButton]}
            onPress={handleNope}
          />
          <IconButton
            icon="star"
            size={30}
            iconColor="#3AB4CC"
            style={[styles.button, styles.smallButton]}
            onPress={handleMatch}
          />
          <IconButton
            icon="heart"
            size={40}
            iconColor="#4CCC93"
            style={[styles.button, styles.largeButton]}
            onPress={handleMatch}
          />
          <IconButton
            icon="flash"
            size={30}
            iconColor="#915DD1"
            style={[styles.button, styles.smallButton]}
            onPress={() => Vibration.vibrate(30)}
          />
        </View>
      )}

      {matchAnimation && (
        <BlurView intensity={100} style={styles.matchAnimation}>
          <Text style={styles.matchText}>It's a Match! 🐾</Text>
        </BlurView>
      )}

      {lastAction && (
        <Animated.View style={styles.actionFeedback}>
          <BlurView intensity={100} style={styles.blurView}>
            <Text
              style={[
                styles.actionText,
                {
                  color: lastAction === "matched" ? "#4CCC93" : "#EC5E6F",
                },
              ]}
            >
              {lastAction === "matched" ? "Matched!" : "Noped!"}
            </Text>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  animatedCard: {
    height: SCREEN_HEIGHT - 180,
    width: SCREEN_WIDTH - 40,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 180,
    borderRadius: 24,
    overflow: "hidden",
    resizeMode: "cover",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: "flex-end",
  },
  cardName: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSpecies: {
    fontSize: 18,
    color: "white",
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
    opacity: 0.9,
  },
  cardDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
  },
  cardDetailText: {
    color: "white",
    fontSize: 14,
    opacity: 0.9,
    marginRight: 8,
  },
  bottomContainer: {
    height: 100,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  largeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  matchAnimation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  matchText: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
  },
  actionFeedback: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  actionText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CCC93",
  },
  blurView: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
  },
  bioButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  bioContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  bioBlurView: {
    padding: 24,
    borderRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  bioText: {
    fontSize: 16,
    color: "white",
    marginBottom: 16,
    lineHeight: 24,
  },
  bioInfoSection: {
    marginTop: 20,
  },
  bioInfoTitle: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    marginBottom: 12,
  },
  bioInfoText: {
    fontSize: 14,
    color: "white",
    marginBottom: 8,
    lineHeight: 20,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#4CCC93",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  carouselIndicators: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  carouselIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: "white",
    width: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#EC5E6F",
    marginBottom: 20,
    textAlign: "center",
  },
  swiperContainer: {
    flex: 1,
  },
  swiperCard: {
    flex: 1,
    borderRadius: 24,
    justifyContent: "center",
    backgroundColor: "white",
  },
});
