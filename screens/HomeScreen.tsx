import React, { useState, useRef, useCallback, useEffect } from "react";
import { StyleSheet, View, Dimensions, Image, Animated, Platform, TouchableOpacity, Alert } from "react-native";
import {
  Appbar,
  Avatar,
  IconButton,
  Text,
  useTheme,
  Badge,
} from "react-native-paper";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Pet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  images: string[];
  distance: string;
  bio: string;
  likes: string[];
  verified: boolean;
  lastActive: string;
};

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const swiperRef = useRef<Swiper<Pet>>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMatches, setHasNewMatches] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const swipeAnimationValue = useRef(new Animated.Value(0)).current;

  const [pets] = useState<Pet[]>([
    {
      id: '1',
      name: 'Luna',
      breed: 'Golden Retriever',
      age: '2',
      images: [
        'https://images.unsplash.com/photo-1552053831-71594a27632d',
        'https://images.unsplash.com/photo-1633722715463-d30f4f325e24',
        'https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf',
      ],
      distance: '2 miles away',
      bio: 'Loving, playful and super friendly! Looking for a walking buddy 🐾\nLoves: Tennis balls 🎾, Swimming 🏊‍♂️, Cuddles ❤️',
      likes: ['treats', 'walks', 'swimming'],
      verified: true,
      lastActive: '3 mins ago'
    },
    {
      id: '2',
      name: 'Rocky',
      breed: 'German Shepherd',
      age: '3',
      images: [
        'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95',
        'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01',
      ],
      distance: '4 miles away',
      bio: 'Intelligent and loyal companion. Excellent at fetch! 🦮\nTraining level: Advanced 🎯\nLooking for: Active playmates',
      likes: ['agility', 'training', 'fetch'],
      verified: false,
      lastActive: 'Just now'
    },
    // Add more sample pets as needed
  ]);

  const handleLike = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const chance = Math.random();
    if (chance > 0.7) {
      setTimeout(() => {
        Alert.alert(
          "It's a Match! 🎉",
          `You and ${pets[index].name} have liked each other!`,
          [
            { text: "Keep Swiping", style: "cancel" },
            { text: "Send Message", style: "default" }
          ]
        );
      }, 500);
    }
  }, [pets]);

  const handleSuperLike = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Super Like Used! ⭐️",
      `${pets[index].name} will see that you super liked them!`,
      [{ text: "OK" }]
    );
  }, [pets]);

  const renderCard = (pet: Pet, index: number) => {
    return (
      <Animated.View style={[styles.cardContainer, {
        transform: [{
          scale: swipeAnimationValue.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0.96, 1, 0.96]
          })
        }]
      }]}>
        <Animated.View style={[styles.cardImageContainer, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: pet.images[currentPhotoIndex] }}
            style={styles.cardImage}
          />
          
          {/* Photo navigation dots */}
          <View style={styles.photoDots}>
            {pet.images.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.photoDot,
                  { backgroundColor: idx === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
                ]}
              />
            ))}
          </View>

          {/* Photo navigation buttons */}
          <TouchableOpacity
            style={[styles.photoNavButton, { left: 0 }]}
            onPress={() => {
              if (currentPhotoIndex > 0) {
                Animated.sequence([
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  })
                ]).start();
                setCurrentPhotoIndex(prev => prev - 1);
              }
            }}
          >
            <View style={styles.photoNavHitArea} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoNavButton, { right: 0 }]}
            onPress={() => {
              if (currentPhotoIndex < pet.images.length - 1) {
                Animated.sequence([
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                  }),
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  })
                ]).start();
                setCurrentPhotoIndex(prev => prev + 1);
              }
            }}
          >
            <View style={styles.photoNavHitArea} />
          </TouchableOpacity>

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />

          {/* Pet info overlay */}
          <BlurView intensity={Platform.OS === 'ios' ? 30 : 100} tint="dark" style={styles.infoContainer}>
            <View style={styles.mainInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{pet.name}, {pet.age}</Text>
                {pet.verified && (
                  <MaterialCommunityIcons name="check-decagram" size={24} color="#00a2ff" />
                )}
              </View>
              <Text style={styles.breed}>{pet.breed}</Text>
              <View style={styles.distanceContainer}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
                <Text style={styles.distance}>{pet.distance}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.lastActive}>{pet.lastActive}</Text>
              </View>
            </View>
            
            <Text style={styles.bio}>{pet.bio}</Text>
            
            <View style={styles.tagsContainer}>
              {pet.likes.map((like, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{like}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom header */}
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar.Image
            size={40}
            source={{ uri: "https://images.unsplash.com/photo-1517423568366-8b83523034fd" }}
            style={styles.profileAvatar}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerIcons}
          onPress={() => navigation.navigate('Matches')}
        >
          <MaterialCommunityIcons name="paw" size={32} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>pawtalk</Text>
          {hasNewMatches && (
            <Badge style={styles.matchBadge} size={8} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
          <MaterialCommunityIcons 
            name="message" 
            size={28} 
            color={theme.colors.primary}
          />
          {hasNewMessages && (
            <Badge 
              style={styles.messageBadge}
              size={16}
            >
              3
            </Badge>
          )}
        </TouchableOpacity>
      </Appbar.Header>

      <View style={styles.content}>
        <Swiper
          ref={swiperRef}
          cards={pets}
          renderCard={renderCard}
          onSwipedLeft={(cardIndex) => {
            console.log(`Passed on ${pets[cardIndex].name}`);
            setCurrentPhotoIndex(0);
            setCurrentIndex(cardIndex + 1);
          }}
          onSwipedRight={(cardIndex) => {
            handleLike(cardIndex);
            setCurrentPhotoIndex(0);
            setCurrentIndex(cardIndex + 1);
          }}
          onSwipedTop={(cardIndex) => {
            handleSuperLike(cardIndex);
            setCurrentPhotoIndex(0);
            setCurrentIndex(cardIndex + 1);
          }}
          cardIndex={currentIndex}
          backgroundColor={'transparent'}
          stackSize={3}
          stackSeparation={15}
          animateCardOpacity
          cardVerticalMargin={0}
          verticalSwipe={true}
          swipeAnimationDuration={350}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: styles.overlayLabel,
                wrapper: styles.overlayWrapper
              }
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  ...styles.overlayLabel,
                  backgroundColor: theme.colors.primary,
                },
                wrapper: {
                  ...styles.overlayWrapper,
                  alignItems: 'flex-start',
                  marginLeft: 30,
                }
              }
            },
            top: {
              title: 'SUPER\nLIKE',
              style: {
                label: {
                  ...styles.overlayLabel,
                  backgroundColor: '#00a2ff',
                },
                wrapper: {
                  ...styles.overlayWrapper,
                  alignItems: 'center',
                  marginTop: 30,
                }
              }
            }
          }}
          onSwipeStart={() => {
            Animated.timing(swipeAnimationValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }}
          onSwipeEnd={() => {
            Animated.timing(swipeAnimationValue, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (swiperRef.current && currentIndex > 0) {
                swiperRef.current.swipeBack();
                setCurrentIndex(prev => prev - 1);
              }
            }}
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
            size={32}
            containerColor="#00a2ff20"
            iconColor="#00a2ff"
            onPress={() => {
              if (swiperRef.current) {
                swiperRef.current.swipeTop();
              }
            }}
            style={styles.actionButton}
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                "Boost Profile",
                "Get more visibility for 30 minutes!",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Boost Now!", style: "default" }
                ]
              );
            }}
            style={styles.smallActionButton}
          />
        </View>
      </View>
    </View>
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
    position: 'relative',
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
  matchBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4458',
  },
  messageBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4458',
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    height: SCREEN_HEIGHT - 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImageContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: SCREEN_WIDTH - 20,
    height: '100%',
    borderRadius: 20,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  mainInfo: {
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  breed: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  distance: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  dot: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginHorizontal: 4,
  },
  lastActive: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  bio: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
  photoDots: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    zIndex: 10,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  photoNavButton: {
    position: 'absolute',
    top: 0,
    bottom: '50%',
    width: '30%',
    zIndex: 5,
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
  overlayLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'white',
    color: 'white',
    textAlign: 'center',
    textTransform: 'uppercase',
    backgroundColor: '#ff4458',
  },
  overlayWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 30,
    marginRight: 30,
  },
});