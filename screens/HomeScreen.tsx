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
} from "react-native";
import { IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../config/firebase";
import { Pet } from "../types/Pet";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const SWIPE_THRESHOLD = 120;

export default function HomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const bioAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const petsQuery = query(
        collection(db, "pets"),
        where("status", "==", "Active"),
        limit(10)
      );
      const querySnapshot = await getDocs(petsQuery);
      const fetchedPets: Pet[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPets.push({ id: doc.id, ...doc.data() } as Pet);
      });
      setPets(fetchedPets);
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

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

  const handleLike = useCallback(() => {
    Vibration.vibrate(50);
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
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      setLastAction("liked");
      if (Math.random() > 0.7) {
        setMatchAnimation(true);
        setTimeout(() => setMatchAnimation(false), 1500);
      }
    });
  }, []);

  const handleNope = useCallback(() => {
    Vibration.vibrate(50);
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
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      setLastAction("noped");
    });
  }, []);

  const handleSuperLike = useCallback(() => {
    Vibration.vibrate([0, 50, 50, 50]);
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
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      setLastAction("superliked");
      if (Math.random() > 0.5) {
        setMatchAnimation(true);
        setTimeout(() => setMatchAnimation(false), 1500);
      }
    });
  }, []);

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

  const renderPets = () => {
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
              <Image style={styles.cardImage} source={{ uri: pet.mainImage }} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.9)"]}
                style={styles.cardGradient}
              >
                <Text style={styles.cardName}>
                  {pet.name}, {pet.age}
                </Text>
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
                  <Text style={styles.bioText}>{pet.notes}</Text>
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
              <Image style={styles.cardImage} source={{ uri: pet.mainImage }} />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.9)"]}
                style={styles.cardGradient}
              >
                <Text style={styles.cardName}>
                  {pet.name}, {pet.age}
                </Text>
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
      <View style={styles.bottomContainer}>
        <IconButton
          icon="refresh"
          size={30}
          iconColor="#FBD88B"
          style={[styles.button, styles.smallButton]}
          onPress={() => {
            Vibration.vibrate(30);
            setCurrentIndex(0);
          }}
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
    flex: 1,
    height: null,
    width: null,
    resizeMode: "cover",
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
  },
  bioText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
});
