import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  Text,
  Vibration,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { Pet } from "../types/Pet";
import { Match, MatchStatus } from "../types/Match";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

export default function HomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const bioAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const matchesQuery = query(
        collection(db, "matches"),
        where("userId", "==", userId)
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchedPetIds = matchesSnapshot.docs.map((doc) => doc.data().petId);

      if (matchedPetIds.length === 0) {
        matchedPetIds.push("placeholder");
      }

      const petsQuery = query(
        collection(db, "pets"),
        where("status", "==", "Active"),
        where("id", "not-in", matchedPetIds),
        limit(10)
      );

      const querySnapshot = await getDocs(petsQuery);
      const fetchedPets: Pet[] = [];

      querySnapshot.forEach((doc) => {
        const petData = doc.data();
        fetchedPets.push({
          id: doc.id,
          ...petData,
          createdAt: (petData.createdAt as Timestamp).toDate(),
          updatedAt: (petData.updatedAt as Timestamp).toDate(),
        } as Pet);
      });

      setPets(fetchedPets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      setError(error instanceof Error ? error.message : "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (status: MatchStatus) => {
    if (!auth.currentUser?.uid || currentIndex >= pets.length) return null;

    try {
      const matchRef = doc(collection(db, "matches"));
      const match: Match = {
        id: matchRef.id,
        userId: auth.currentUser.uid,
        petId: pets[currentIndex].id,
        status,
        createdAt: serverTimestamp() as Timestamp,
      };

      await updateDoc(doc(db, "pets", pets[currentIndex].id), {
        lastActivity: serverTimestamp(),
      });

      if (status === "liked") {
        const existingMatchQuery = query(
          collection(db, "matches"),
          where("petId", "==", pets[currentIndex].id),
          where("userId", "==", auth.currentUser.uid),
          where("status", "==", "liked")
        );

        const querySnapshot = await getDocs(existingMatchQuery);
        if (!querySnapshot.empty) {
          match.status = "matched";
          match.matchedAt = serverTimestamp() as Timestamp;

          await Promise.all([
            updateDoc(doc(db, "pets", pets[currentIndex].id), {
              matches: arrayUnion(auth.currentUser.uid),
              matchRate: increment(0.1),
            }),
            updateDoc(doc(db, "users", auth.currentUser.uid), {
              "settings.lastMatch": serverTimestamp(),
            }),
          ]);

          setMatchAnimation(true);
          setTimeout(() => setMatchAnimation(false), 1500);
        }
      }

      await setDoc(matchRef, match);
      return match;
    } catch (error) {
      console.error("Error creating match:", error);
      return null;
    }
  };

  const handleLike = useCallback(async () => {
    if (currentIndex >= pets.length) return;

    Vibration.vibrate(50);
    await createMatch("liked");

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: SCREEN_WIDTH + 100, y: 0 },
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setCurrentImageIndex(0);
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      setLastAction("liked");
    });
  }, [currentIndex, pets.length]);

  const handleNope = useCallback(async () => {
    if (currentIndex >= pets.length) return;

    Vibration.vibrate(50);
    await createMatch("passed");

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setCurrentImageIndex(0);
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      setLastAction("noped");
    });
  }, [currentIndex, pets.length]);

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= pets.length) return;

    Vibration.vibrate([0, 50, 50, 50]);
    const match = await createMatch("liked");

    if (match) {
      await updateDoc(doc(db, "pets", pets[currentIndex].id), {
        superLikes: arrayUnion(auth.currentUser?.uid),
        matchRate: increment(0.2),
      });
    }

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: 0, y: -SCREEN_HEIGHT - 100 },
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setCurrentImageIndex(0);
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      setLastAction("superliked");
    });
  }, [currentIndex, pets.length]);

  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const toggleBio = useCallback(() => {
    setShowBio((prev) => !prev);
    Animated.timing(bioAnimation, {
      toValue: showBio ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBio]);

  const handleImagePress = useCallback(() => {
    if (pets[currentIndex] && pets[currentIndex].images.length > 1) {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % pets[currentIndex].images.length
      );
    }
  }, [currentIndex, pets]);

  const handleRefresh = useCallback(async () => {
    Vibration.vibrate(30);
    setCurrentIndex(0);
    setCurrentImageIndex(0);
    await fetchPets();
  }, []);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const rotateAndTranslate = {
    transform: [
      {
        rotate: rotate,
      },
      ...position.getTranslateTransform(),
    ],
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0, 1],
    extrapolate: "clamp",
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.8, 1],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          handleLike();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          handleNope();
        } else if (gestureState.dy < -SWIPE_THRESHOLD) {
          handleSuperLike();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const renderCarouselIndicators = useCallback(() => {
    if (!pets[currentIndex]) return null;
    const images = pets[currentIndex].images;
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

  const renderPets = () => {
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

    return pets
      .map((pet, i) => {
        if (i < currentIndex) {
          return null;
        } else if (i == currentIndex) {
          return (
            <Animated.View
              {...panResponder.panHandlers}
              key={pet.id}
              style={[rotateAndTranslate, styles.animatedCard, { opacity }]}
            >
              <TouchableOpacity activeOpacity={0.9} onPress={handleImagePress}>
                <Image
                  style={styles.cardImage}
                  source={{ uri: pet.images[currentImageIndex] }}
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
                <Text style={styles.cardSpecies}>{pet.species}</Text>
                <View style={styles.tagsContainer}>
                  {pet.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
              <Animated.View
                style={[styles.likeTextContainer, { opacity: likeOpacity }]}
              >
                <BlurView intensity={100} style={styles.blurView}>
                  <Text style={styles.likeText}>LIKE</Text>
                </BlurView>
              </Animated.View>
              <Animated.View
                style={[styles.nopeTextContainer, { opacity: nopeOpacity }]}
              >
                <BlurView intensity={100} style={styles.blurView}>
                  <Text style={styles.nopeText}>NOPE</Text>
                </BlurView>
              </Animated.View>
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
                    <Text style={styles.bioText}>{pet.notes}</Text>
                    <Text style={styles.bioInfoText}>
                      Match Rate: {pet.matchRate}
                    </Text>
                    <Text style={styles.bioInfoText}>
                      Last Activity: {pet.lastActivity}
                    </Text>
                    <Text style={styles.bioInfoText}>
                      Vaccinated: {pet.vaccinated ? "Yes" : "No"}
                    </Text>
                    <Text style={styles.bioInfoText}>
                      Profile Complete: {pet.profileComplete ? "Yes" : "No"}
                    </Text>
                  </ScrollView>
                </BlurView>
              </Animated.View>
            </Animated.View>
          );
        } else {
          return (
            <Animated.View
              key={pet.id}
              style={[
                {
                  opacity: nextCardOpacity,
                  transform: [{ scale: nextCardScale }],
                },
                styles.animatedCard,
              ]}
            >
              <Image
                style={styles.cardImage}
                source={{ uri: pet.images[0] }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.9)"]}
                style={styles.cardGradient}
              >
                <Text style={styles.cardName}>
                  {pet.name}, {pet.age}
                </Text>
                <Text style={styles.cardSpecies}>{pet.species}</Text>
              </LinearGradient>
            </Animated.View>
          );
        }
      })
      .reverse();
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>{renderPets()}</View>
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
            onPress={handleSuperLike}
          />
          <IconButton
            icon="heart"
            size={40}
            iconColor="#4CCC93"
            style={[styles.button, styles.largeButton]}
            onPress={handleLike}
          />
          <IconButton
            icon="flash"
            size={30}
            iconColor="#915DD1"
            style={[styles.button, styles.smallButton]}
            onPress={() => {
              Vibration.vibrate(30);
            }}
          />
        </View>
      )}
      {matchAnimation && (
        <BlurView intensity={100} style={styles.matchAnimation}>
          <Text style={styles.matchText}>It's a Match!</Text>
        </BlurView>
      )}
      {lastAction && (
        <Animated.View style={styles.actionFeedback}>
          <BlurView intensity={100} style={styles.blurView}>
            <Text style={styles.actionText}>
              {lastAction === "liked"
                ? "Liked!"
                : lastAction === "noped"
                ? "Noped!"
                : "Super Liked!"}
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
    height: SCREEN_HEIGHT - 200,
    width: SCREEN_WIDTH - 40,
    padding: 10,
    position: "absolute",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  cardGradient: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    height: 200,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "flex-end",
  },
  cardName: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
  },
  cardSpecies: {
    fontSize: 18,
    color: "white",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "white",
    fontSize: 12,
  },
  bottomContainer: {
    height: 120,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
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
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  largeButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  likeTextContainer: {
    position: "absolute",
    top: 50,
    left: 40,
    zIndex: 1000,
    transform: [{ rotate: "-30deg" }],
  },
  nopeTextContainer: {
    position: "absolute",
    top: 50,
    right: 40,
    zIndex: 1000,
    transform: [{ rotate: "30deg" }],
  },
  likeText: {
    borderWidth: 2,
    borderColor: "#4CCC93",
    color: "#4CCC93",
    fontSize: 32,
    fontWeight: "800",
    padding: 10,
  },
  nopeText: {
    borderWidth: 2,
    borderColor: "#EC5E6F",
    color: "#EC5E6F",
    fontSize: 32,
    fontWeight: "800",
    padding: 10,
  },
  matchAnimation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  matchText: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
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
    padding: 10,
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
    left: 10,
    right: 10,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  bioBlurView: {
    padding: 20,
    borderRadius: 20,
    maxHeight: 300,
  },
  bioText: {
    fontSize: 16,
    color: "white",
    marginBottom: 10,
  },
  bioInfoText: {
    fontSize: 14,
    color: "white",
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#4CCC93",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  carouselIndicators: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: "white",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EC5E6F",
    marginBottom: 20,
    textAlign: "center",
  },
});
