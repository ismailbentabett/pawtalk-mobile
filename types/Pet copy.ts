export interface Pet {
  id: string;
  name: string;
  species: string;
  age: number;
  owner: string;
  status: 'Active' | 'Inactive';
  matchRate: string;
  lastActivity: string;
  matches: string[];
  humans: string[];
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  tags: string[];
  vaccinated: boolean;
  profileComplete: boolean;
  images : string[];
  mainImage : string;
}

export interface PetFilters {
  species: string[];
  status: ('Active' | 'Inactive')[];
  ageRange: { min: number; max: number };
  matchRateThreshold: number;
  tags: string[];
}

