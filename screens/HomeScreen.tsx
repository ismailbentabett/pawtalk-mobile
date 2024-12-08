import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

const Users = [
  {
    id: "1",
    name: "Sarah",
    age: 28,
    uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "2",
    name: "Jake",
    age: 32,
    uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "3",
    name: "Emma",
    age: 25,
    uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "4",
    name: "Alex",
    age: 30,
    uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "5",
    name: "Olivia",
    age: 27,
    uri: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
];

export default function HomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
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
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0, 0],
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      position.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 120) {
        Animated.spring(position, {
          toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy },
          useNativeDriver: true,
        }).start(() => {
          setCurrentIndex((prevIndex) => prevIndex + 1);
          position.setValue({ x: 0, y: 0 });
        });
      } else if (gestureState.dx < -120) {
        Animated.spring(position, {
          toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy },
          useNativeDriver: true,
        }).start(() => {
          setCurrentIndex((prevIndex) => prevIndex + 1);
          position.setValue({ x: 0, y: 0 });
        });
      } else {
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 4,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const renderUsers = () => {
    return Users.map((item, i) => {
      if (i < currentIndex) {
        return null;
      } else if (i == currentIndex) {
        return (
          <Animated.View
            {...panResponder.panHandlers}
            key={item.id}
            style={[rotateAndTranslate, styles.animatedCard]}
          >
            <Animated.View
              style={[styles.likeTextContainer, { opacity: likeOpacity }]}
            >
              <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            <Animated.View
              style={[styles.nopeTextContainer, { opacity: nopeOpacity }]}
            >
              <Text style={styles.nopeText}>NOPE</Text>
            </Animated.View>
            <Image style={styles.cardImage} source={{ uri: item.uri }} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.9)"]}
              style={styles.cardGradient}
            >
              <Text style={styles.cardName}>
                {item.name}, {item.age}
              </Text>
            </LinearGradient>
          </Animated.View>
        );
      } else {
        return (
          <Animated.View
            key={item.id}
            style={[
              {
                opacity: nextCardOpacity,
                transform: [{ scale: nextCardScale }],
              },
              styles.animatedCard,
            ]}
          >
            <Image style={styles.cardImage} source={{ uri: item.uri }} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.9)"]}
              style={styles.cardGradient}
            >
              <Text style={styles.cardName}>
                {item.name}, {item.age}
              </Text>
            </LinearGradient>
          </Animated.View>
        );
      }
    }).reverse();
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>{renderUsers()}</View>
      <View style={styles.bottomContainer}>
        <IconButton
          icon="refresh"
          size={30}
          iconColor="#FBD88B"
          style={[styles.button, styles.smallButton]}
          onPress={() => {}}
        />
        <IconButton
          icon="close"
          size={40}
          iconColor="#EC5E6F"
          style={[styles.button, styles.largeButton]}
          onPress={() => {}}
        />
        <IconButton
          icon="star"
          size={30}
          iconColor="#3AB4CC"
          style={[styles.button, styles.smallButton]}
          onPress={() => {}}
        />
        <IconButton
          icon="heart"
          size={40}
          iconColor="#4CCC93"
          style={[styles.button, styles.largeButton]}
          onPress={() => {}}
        />
        <IconButton
          icon="flash"
          size={30}
          iconColor="#915DD1"
          style={[styles.button, styles.smallButton]}
          onPress={() => {}}
        />
      </View>
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
});
