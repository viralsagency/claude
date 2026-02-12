import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightMeasurement, UserProfile } from '../types';

const MEASUREMENTS_KEY = '@ble_scale/measurements';
const PROFILE_KEY = '@ble_scale/profile';

export async function saveMeasurement(
  measurement: WeightMeasurement
): Promise<void> {
  const existing = await getMeasurements();
  existing.unshift(measurement);
  // Keep last 500 measurements
  const trimmed = existing.slice(0, 500);
  await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(trimmed));
}

export async function getMeasurements(): Promise<WeightMeasurement[]> {
  const raw = await AsyncStorage.getItem(MEASUREMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function deleteMeasurement(id: string): Promise<void> {
  const existing = await getMeasurements();
  const filtered = existing.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(filtered));
}

export async function clearAllMeasurements(): Promise<void> {
  await AsyncStorage.removeItem(MEASUREMENTS_KEY);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
