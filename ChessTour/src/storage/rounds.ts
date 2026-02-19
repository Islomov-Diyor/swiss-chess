import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { Round } from '../types';
import { STORAGE_KEYS } from './keys';

async function getAllRounds(): Promise<Round[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ROUNDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setAllRounds(rounds: Round[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
    throw e;
  }
}

export async function getRoundsByTournamentId(tournamentId: string): Promise<Round[]> {
  const list = await getAllRounds();
  return list.filter((r) => r.tournament_id === tournamentId);
}

export async function getRoundByTournamentIdAndNumber(
  tournamentId: string,
  roundNumber: number
): Promise<Round | null> {
  const list = await getAllRounds();
  return list.find((r) => r.tournament_id === tournamentId && r.round_number === roundNumber) ?? null;
}

export async function updateRound(updated: Round): Promise<void> {
  const list = await getAllRounds();
  const idx = list.findIndex((r) => r.id === updated.id);
  if (idx === -1) return;
  list[idx] = updated;
  await setAllRounds(list);
}

export async function addRound(round: Round): Promise<void> {
  const list = await getAllRounds();
  list.push(round);
  await setAllRounds(list);
}
