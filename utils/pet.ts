import { Pet } from '../types/Pet';

export const getImageArray = (pet: Pet): string[] => {
  const images: string[] = [];
  if (pet.images?.main) images.push(pet.images.main);
  if (pet.images?.additional?.length) images.push(...pet.images.additional);
  return images;
};

