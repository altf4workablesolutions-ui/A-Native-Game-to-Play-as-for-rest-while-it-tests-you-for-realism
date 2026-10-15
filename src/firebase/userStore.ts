import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config.ts';
import { INITIAL_UPGRADES, UpgradesState } from '../game/rules.ts';

export interface UserProfileData {
  displayName: string;
  photoURL?: string;
  coins: number;
  totalSnowCleared: number;
  highScore: number;
  bestCombo: number;
  upgrades: UpgradesState;
  selectedColor: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LeaderboardEntryData {
  id?: string;
  userId: string;
  displayName: string;
  score: number;
  snowCleared: number;
  bestCombo: number;
  district: string;
  createdAt?: unknown;
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveInitialProfile(userId: string, displayName: string, photoURL?: string): Promise<UserProfileData> {
  const path = `users/${userId}`;
  const newProfile: UserProfileData = {
    displayName: displayName.slice(0, 64) || 'Plow Driver',
    photoURL: photoURL ? photoURL.slice(0, 512) : undefined,
    coins: 50, // Starting welcome bonus
    totalSnowCleared: 0,
    highScore: 0,
    bestCombo: 1,
    upgrades: { ...INITIAL_UPGRADES },
    selectedColor: 'classic-yellow',
  };

  const payload: Record<string, unknown> = {
    displayName: newProfile.displayName,
    coins: newProfile.coins,
    totalSnowCleared: newProfile.totalSnowCleared,
    highScore: newProfile.highScore,
    bestCombo: newProfile.bestCombo,
    upgrades: newProfile.upgrades,
    selectedColor: newProfile.selectedColor,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (newProfile.photoURL) {
    payload.photoURL = newProfile.photoURL;
  }

  try {
    await setDoc(doc(db, 'users', userId), payload);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return newProfile;
  }
}

export async function updateUserProgress(
  userId: string,
  updates: {
    coins?: number;
    totalSnowCleared?: number;
    highScore?: number;
    bestCombo?: number;
    upgrades?: UpgradesState;
    selectedColor?: string;
  }
) {
  const path = `users/${userId}`;
  try {
    const payload: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, 'users', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitLeaderboardScore(entry: {
  score: number;
  snowCleared: number;
  bestCombo: number;
  district: string;
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const entryId = `${currentUser.uid}_${Date.now()}`;
  const path = `leaderboard/${entryId}`;
  try {
    await setDoc(doc(db, 'leaderboard', entryId), {
      userId: currentUser.uid,
      displayName: (currentUser.displayName || 'Plow Driver').slice(0, 64),
      score: Math.max(0, entry.score),
      snowCleared: Math.max(0, entry.snowCleared),
      bestCombo: Math.max(1, entry.bestCombo),
      district: entry.district.slice(0, 64),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getTopLeaderboard(districtLimit = 15): Promise<LeaderboardEntryData[]> {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(districtLimit));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as LeaderboardEntryData),
    }));
  } catch (error) {
    console.warn('Leaderboard fetch note:', error);
    return [];
  }
}
