import React, { useState, useRef } from "react";
import { StyleSheet, View, Dimensions, Image, Animated, Platform, TouchableOpacity } from "react-native";
import {
  Appbar,
  Avatar,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { NavigationProp } from "@react-navigation/native";
import { ProtectedComponent } from "../components/ProtectedComponent";
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

type Pet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  images: string[];
  distance: string;
  bio: string;
};

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const swiperRef = useRef<Swiper<Pet>>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [pets] = useState<Pet[]>([
    {
      id: '1',
      name: 'Luna',
      breed: 'Golden Retriever',
      age: '2',
      images: [
        'https://placekitten.com/400/600',
        'https://placekitten.com/401/600',
        'https://placekitten.com/402/600'
      ],
      distance: '2 miles away',
      bio: 'Loves long walks and tennis balls. Will do anything for treats! 🎾🦮'
    },
    // Add more sample pets...
  ]);

  const renderCard = (pet: Pet) => {
    const imageOpacity = fadeAnim;

    return (
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.cardImageContainer, { opacity: imageOpacity }]}>
          <Image
            source={{ uri: pet.images[currentPhotoIndex] }}
            style={styles.cardImage}
          />
          
          {/* Photo navigation dots */}
          <View style={styles.photoDots}>
            {pet.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoDot,
                  { backgroundColor: index === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
                ]}
              />
            ))}
          </View>

          {/* Left/Right photo navigation */}
          <TouchableOpacity
            style={[styles.photoNavButton, { left: 0 }]}
            onPress={() => {
              if (currentPhotoIndex > 0) {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }).start(() => {
                  setCurrentPhotoIndex(prev => prev - 1);
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }).start();
                });
              }
            }}
          >
            <View style={styles.photoNavHitArea} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoNavButton, { right: 0 }]}
            onPress={() => {
              if (currentPhotoIndex < pet.images.length - 1) {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }).start(() => {
                  setCurrentPhotoIndex(prev => prev + 1);
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }).start();
                });
              }
            }}
          >
            <View style={styles.photoNavHitArea} />
          </TouchableOpacity>

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          />

          {/* Pet info overlay */}
          <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} style={styles.infoContainer}>
            <View style={styles.mainInfo}>
              <Text style={styles.name}>{pet.name}, {pet.age}</Text>
              <Text style={styles.breed}>{pet.breed}</Text>
              <Text style={styles.distance}>{pet.distance}</Text>
            </View>
            <Text style={styles.bio}>{pet.bio}</Text>
          </BlurView>
        </Animated.View>
      </View>
    );
  };

  return (
    <ProtectedComponent fallback={<Text>Access Denied</Text>}>
      <View style={styles.container}>
        {/* Custom header with Tinder-style design */}
        <Appbar.Header style={styles.header}>
          <Avatar.Image
            size={40}
            source={{ uri: "https://placekitten.com/200/200" }}
            style={styles.profileAvatar}
          />
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="paw" size={32} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>pawtalk</Text>
          </View>
          <IconButton
            icon="cog"
            size={28}
            iconColor={theme.colors.primary}
            onPress={() => {}}
          />
        </Appbar.Header>

        <View style={styles.content}>
          <Swiper
            ref={swiperRef}
            cards={pets}
            renderCard={renderCard}
            onSwipedLeft={(cardIndex) => {
              console.log(`Passed on ${pets[cardIndex].name}`);
              setCurrentPhotoIndex(0);
            }}
            onSwipedRight={(cardIndex) => {
              console.log(`Liked ${pets[cardIndex].name}`);
              setCurrentPhotoIndex(0);
            }}
            cardIndex={0}
            backgroundColor={'transparent'}
            stackSize={3}
            stackSeparation={15}
            animateCardOpacity
            cardVerticalMargin={0}
            verticalSwipe={false}
            overlayLabels={{
              left: {
                title: 'NOPE',
                style: {
                  label: {
                    backgroundColor: theme.colors.error,
                    color: 'white',
                    fontSize: 32,
                    borderRadius: 4,
                    padding: 10,
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: -30
                  }
                }
              },
              right: {
                title: 'LIKE',
                style: {
                  label: {
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    fontSize: 32,
                    borderRadius: 4,
                    padding: 10,
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: 30
                  }
                }
              }
            }}
          />

          {/* Bottom action buttons */}
          <View style={styles.actions}>
            <IconButton
              icon="reload"
              mode="contained-tonal"
              size={24}
              containerColor={theme.colors.surfaceVariant}
              iconColor={theme.colors.primary}
              onPress={() => {}}
              style={styles.smallActionButton}
            />
            <IconButton
              icon="close"
              mode="contained-tonal"
              size={32}
              containerColor={theme.colors.errorContainer}
              iconColor={theme.colors.error}
              onPress={() => {
                if (swiperRef.current) {
                  swiperRef.current.swipeLeft();
                }
              }}
              style={styles.actionButton}
            />
            <IconButton
              icon="star"
              mode="contained-tonal"
              size={24}
              containerColor={theme.colors.secondaryContainer}
              iconColor={theme.colors.secondary}
              onPress={() => {}}
              style={styles.smallActionButton}
            />
            <IconButton
              icon="heart"
              mode="contained"
              size={32}
              containerColor={theme.colors.primary}
              iconColor={theme.colors.onPrimary}
              onPress={() => {
                if (swiperRef.current) {
                  swiperRef.current.swipeRight();
                }
              }}
              style={styles.actionButton}
            />
            <IconButton
              icon="lightning-bolt"
              mode="contained-tonal"
              size={24}
              containerColor={theme.colors.tertiaryContainer}
              iconColor={theme.colors.tertiary}
              onPress={() => {}}
              style={styles.smallActionButton}
            />
          </View>
        </View>
      </View>
    </ProtectedComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerIcons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4458',
  },
  profileAvatar: {
    borderWidth: 2,
    borderColor: '#ff4458',
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    height: SCREEN_HEIGHT - 180,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardImageContainer: {
    flex: 1,
  },
  cardImage: {
    width: SCREEN_WIDTH - 20,
    height: '100%',
    borderRadius: 10,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  mainInfo: {
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  breed: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  distance: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.7,
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  photoDots: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  photoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  photoNavButton: {
    position: 'absolute',
    top: 0,
    bottom: '40%',
    width: '30%',
  },
  photoNavHitArea: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    transform: [{ scale: 1.2 }],
  },
  smallActionButton: {
    transform: [{ scale: 0.9 }],
  },
});