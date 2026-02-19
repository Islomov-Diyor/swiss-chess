import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { Tournament } from '../types';
import { STORAGE_KEYS } from './keys';

export async function getTournaments(): Promise<Tournament[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const list = await getTournaments();
  return list.find((t) => t.id === id) ?? null;
}

export async function setTournaments(tournaments: Tournament[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
    throw e;
  }
}

export async function updateTournament(updated: Tournament): Promise<void> {
  const list = await getTournaments();
  const idx = list.findIndex((t) => t.id === updated.id);
  if (idx === -1) return;
  list[idx] = updated;
  await setTournaments(list);
}

export async function deleteTournamentById(id: string): Promise<void> {
  try {
    const [tournaments, playersRaw, roundsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENTS),
      AsyncStorage.getItem(STORAGE_KEYS.PLAYERS),
      AsyncStorage.getItem(STORAGE_KEYS.ROUNDS),
    ]);

    const list: Tournament[] = tournaments ? JSON.parse(tournaments) : [];
    const newList = list.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(newList));

    if (playersRaw) {
      const players = JSON.parse(playersRaw);
      const filtered = Array.isArray(players) ? players.filter((p: { tournament_id: string }) => p.tournament_id !== id) : [];
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(filtered));
    }

    if (roundsRaw) {
      const rounds = JSON.parse(roundsRaw);
      const filtered = Array.isArray(rounds) ? rounds.filter((r: { tournament_id: string }) => r.tournament_id !== id) : [];
      await AsyncStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(filtered));
    }
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
    throw e;
  }
}
