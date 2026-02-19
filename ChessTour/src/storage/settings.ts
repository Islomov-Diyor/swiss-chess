import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { STORAGE_KEYS } from './keys';

export type ThemeMode = 'light' | 'dark';

const DEFAULT_ROUNDS = 5;

export async function getStoredTheme(): Promise<ThemeMode> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (v === 'light' || v === 'dark') return v;
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
  return 'light';
}

export async function setStoredTheme(theme: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
}

export async function getStoredDefaultRounds(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_ROUNDS);
    if (v != null) {
      const n = parseInt(v, 10);
      if (n >= 3 && n <= 7) return n;
    }
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
  return DEFAULT_ROUNDS;
}

export async function setStoredDefaultRounds(n: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_ROUNDS, String(n));
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
}

export async function getStoredShowRatings(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.SHOW_RATINGS);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
  return true;
}

export async function setStoredShowRatings(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SHOW_RATINGS, on ? 'true' : 'false');
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
}
