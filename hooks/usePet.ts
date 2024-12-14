import { useState, useCallback, useEffect } from 'react';
import { Vibration } from 'react-native';
import { Pet } from '../types/Pet';
import { PetService } from '../services/PetService';
import { useAuth } from './useAuth';

export const usePet = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBio, setShowBio] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchPets = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const fetchedPets = await PetService.fetchPets();
      setPets(fetchedPets);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleSwipedLeft = useCallback(() => {
    Vibration.vibrate(50);
    setCurrentIndex((prevIndex) => prevIndex + 1);
    setCurrentImageIndex(0);
    setLastAction('noped');
  }, []);

  const handleSwipedRight = useCallback(async () => {
    if (!user) return;
    try {
      Vibration.vibrate(50);
      const currentPet = pets[currentIndex];
      await PetService.createMatch(currentPet.id);
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setCurrentImageIndex(0);
      setMatchAnimation(true);
      setTimeout(() => setMatchAnimation(false), 1500);
      setLastAction('matched');
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match');
    }
  }, [user, pets, currentIndex]);

  const resetIndex = useCallback(() => {
    setCurrentIndex(0);
    setCurrentImageIndex(0);
  }, []);

  const handleImagePress = useCallback(() => {
    if (pets[currentIndex]) {
      const images = getImageArray(pets[currentIndex]);
      if (images.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    }
  }, [currentIndex, pets]);

  const toggleBio = useCallback(() => {
    setShowBio((prev) => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
    Vibration.vibrate(30);
    resetIndex();
    await fetchPets();
  }, [resetIndex, fetchPets]);

  const getImageArray = (pet: Pet): string[] => {
    const images: string[] = [];
    if (pet.images?.main) images.push(pet.images.main);
    if (pet.images?.additional?.length) images.push(...pet.images.additional);
    return images;
  };

  return {
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
    resetIndex,
    handleImagePress,
    toggleBio,
    setMatchAnimation,
    setLastAction,
    handleRefresh,
    getImageArray,
  };
};

