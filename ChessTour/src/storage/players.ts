import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { Player } from '../types';
import { STORAGE_KEYS } from './keys';

function defaultPlayer(partial: Partial<Player>): Player {
  return {
    points: 0,
    buchholz: 0,
    color_history: [],
    opponents_played: [],
    had_bye: false,
    wins: 0,
    draws: 0,
    losses: 0,
    ...partial,
  } as Player;
}

async function getAllPlayers(): Promise<Player[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setAllPlayers(players: Player[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
    throw e;
  }
}

export async function getPlayersByTournamentId(tournamentId: string): Promise<Player[]> {
  const list = await getAllPlayers();
  return list.filter((p) => p.tournament_id === tournamentId);
}

export async function getPlayerCountsByTournamentIds(ids: string[]): Promise<Record<string, number>> {
  const list = await getAllPlayers();
  const counts: Record<string, number> = {};
  for (const id of ids) {
    counts[id] = list.filter((p) => p.tournament_id === id).length;
  }
  return counts;
}

export async function addPlayer(player: Omit<Player, 'points' | 'buchholz' | 'color_history' | 'opponents_played' | 'had_bye' | 'wins' | 'draws' | 'losses'>): Promise<void> {
  const full = defaultPlayer({
    ...player,
    rating: player.rating ?? null,
  });
  const list = await getAllPlayers();
  list.push(full);
  await setAllPlayers(list);
}

export async function addPlayersBulk(players: Omit<Player, 'points' | 'buchholz' | 'color_history' | 'opponents_played' | 'had_bye' | 'wins' | 'draws' | 'losses'>[]): Promise<void> {
  const list = await getAllPlayers();
  for (const p of players) {
    list.push(defaultPlayer({ ...p, rating: p.rating ?? null }));
  }
  await setAllPlayers(list);
}

export async function updatePlayer(updated: Player): Promise<void> {
  const list = await getAllPlayers();
  const idx = list.findIndex((p) => p.id === updated.id);
  if (idx === -1) return;
  list[idx] = updated;
  await setAllPlayers(list);
}

export async function deletePlayerById(id: string): Promise<void> {
  const list = await getAllPlayers();
  await setAllPlayers(list.filter((p) => p.id !== id));
}

export async function replacePlayersForTournament(tournamentId: string, players: Player[]): Promise<void> {
  const list = await getAllPlayers();
  const rest = list.filter((p) => p.tournament_id !== tournamentId);
  await setAllPlayers([...rest, ...players]);
}
