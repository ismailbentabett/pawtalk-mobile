import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, ScrollView, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton } from 'react-native-paper';
import Swiper from 'react-native-deck-swiper';
import { usePets } from '../contexts/PetContext';
import { Pet } from '../types/Pet';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const {
    pets,
    loading,
    error,
    currentIndex,
    currentImageIndex,
    showBio,
    matchAnimation,
    lastAction,
    fetchPets,
    handleSwipedLeft,
    handleSwipedRight,
    handleImagePress,
    toggleBio,
    handleRefresh,
    getImageArray,
  } = usePets();

  const renderCarouselIndicators = useCallback((pet: Pet) => {
    const images = getImageArray(pet);

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
  }, [currentImageIndex, getImageArray]);

  const renderCard = useCallback((pet: Pet) => {
    const images = getImageArray(pet);

    return (
      <View style={styles.animatedCard}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleImagePress}>
          <Image
            style={styles.cardImage}
            source={{ uri: images[currentImageIndex] }}
            resizeMode="cover"
          />
          {renderCarouselIndicators(pet)}
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

        {showBio && (
          <BlurView intensity={100} style={styles.bioBlurView}>
            <ScrollView contentContainerStyle={styles.bioScrollView}>
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
                  Location: {pet.location.city}, {pet.location.state}, {pet.location.country}
                </Text>
                <Text style={styles.bioInfoText}>Status: {pet.status}</Text>
                <Text style={styles.bioInfoText}>
                  Added: {pet.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </ScrollView>
          </BlurView>
        )}
      </View>
    );
  }, [currentImageIndex, handleImagePress, renderCarouselIndicators, showBio, toggleBio, getImageArray]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading pets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text>{error}</Text>
        <TouchableOpacity onPress={fetchPets}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pets.length === 0 || currentIndex >= pets.length) {
    return (
      <View style={styles.centerContainer}>
        <Text>No more pets available</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.swiperContainer}>
        <Swiper
          cards={pets}
          renderCard={renderCard}
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwipedAll={handleRefresh}
          cardIndex={currentIndex}
          backgroundColor={'#f5f5f5'}
          stackSize={3}
          stackSeparation={15}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: '#EC5E6F',
                  color: '#EC5E6F',
                  borderWidth: 4,
                  fontSize: 36,
                  fontWeight: '800',
                  padding: 12,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 60,
                  marginLeft: -30,
                },
              },
            },
            right: {
              title: 'MATCH',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: '#4CCC93',
                  color: '#4CCC93',
                  borderWidth: 4,
                  fontSize: 36,
                  fontWeight: '800',
                  padding: 12,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 60,
                  marginLeft: 30,
                },
              },
            },
          }}
        />
      </View>
      
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
          onPress={handleSwipedLeft}
        />
        <IconButton
          icon="star"
          size={30}
          iconColor="#3AB4CC"
          style={[styles.button, styles.smallButton]}
          onPress={handleSwipedRight}
        />
        <IconButton
          icon="heart"
          size={40}
          iconColor="#4CCC93"
          style={[styles.button, styles.largeButton]}
          onPress={handleSwipedRight}
        />
        <IconButton
          icon="flash"
          size={30}
          iconColor="#915DD1"
          style={[styles.button, styles.smallButton]}
          onPress={() => {}} // This button doesn't have a specific action in the original code
        />
      </View>

      {matchAnimation && (
        <BlurView intensity={100} style={styles.matchAnimation}>
          <Text style={styles.matchText}>It's a Match! 🐾</Text>
        </BlurView>
      )}

      {lastAction && (
        <View style={styles.actionFeedback}>
          <BlurView intensity={100} style={styles.blurView}>
            <Text
              style={[
                styles.actionText,
                {
                  color: lastAction === 'matched' ? '#4CCC93' : '#EC5E6F',
                },
              ]}
            >
              {lastAction === 'matched' ? 'Matched!' : 'Noped!'}
            </Text>
          </BlurView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  swiperContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedCard: {
    height: SCREEN_HEIGHT * 0.7,
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
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
    overflow: 'hidden',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.25,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },
  cardName: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSpecies: {
    fontSize: 18,
    color: 'white',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    opacity: 0.9,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cardDetailText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginRight: 8,
  },
  bottomContainer: {
    height: SCREEN_HEIGHT * 0.12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  matchText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionFeedback: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.05,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  blurView: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
  },
  bioButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  bioBlurView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  bioScrollView: {
    paddingBottom: 24,
  },
  bioText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    lineHeight: 24,
  },
  bioInfoSection: {
    marginTop: 20,
  },
  bioInfoTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bioInfoText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    lineHeight: 20,
    opacity: 0.9,
  },
  carouselIndicators: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  carouselIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  carouselIndicatorActive: {
    backgroundColor: 'white',
    width: 12,
  },
});

