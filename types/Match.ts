import { Timestamp } from 'firebase/firestore';

export type MatchStatus = 'liked' | 'passed' | 'matched';

export interface Match {
  id: string;
  userId: string;
  petId: string;
  status: MatchStatus;
  createdAt: Timestamp;
  matchedAt?: Timestamp;
}