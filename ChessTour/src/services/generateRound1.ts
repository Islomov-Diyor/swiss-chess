import { v4 as uuid } from 'uuid';
import type { Player, Round, Pairing } from '../types';
import { addRound } from '../storage/rounds';
import { replacePlayersForTournament } from '../storage/players';

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function generateRound1(
  tournamentId: string,
  players: Player[]
): Promise<Round> {
  const shuffled = fisherYatesShuffle(players);
  let activePlayers: Player[];
  let byePlayer: Player | null = null;
  const updatedPlayers = [...shuffled];

  if (shuffled.length % 2 === 1) {
    byePlayer = shuffled[shuffled.length - 1];
    const byeIdx = updatedPlayers.findIndex((p) => p.id === byePlayer!.id);
    updatedPlayers[byeIdx] = { ...byePlayer, had_bye: true, color_history: [...byePlayer.color_history, 'bye'] };
    byePlayer = updatedPlayers[byeIdx];
    activePlayers = updatedPlayers.slice(0, -1);
  } else {
    activePlayers = shuffled;
  }

  const pairings: Pairing[] = [];
  for (let i = 0; i < activePlayers.length; i += 2) {
    const white = activePlayers[i];
    const black = activePlayers[i + 1];
    const whiteFirst = Math.random() > 0.5;
    const whiteId = whiteFirst ? white.id : black.id;
    const blackId = whiteFirst ? black.id : white.id;
    pairings.push({
      id: uuid(),
      board_number: pairings.length + 1,
      white_player_id: whiteId,
      black_player_id: blackId,
      result: null,
    });
  }

  if (byePlayer) {
    pairings.push({
      id: uuid(),
      board_number: pairings.length + 1,
      white_player_id: byePlayer.id,
      black_player_id: null,
      result: '1-0',
    });
  }

  const round: Round = {
    id: uuid(),
    tournament_id: tournamentId,
    round_number: 1,
    status: 'active',
    pairings,
  };

  await replacePlayersForTournament(tournamentId, updatedPlayers);
  await addRound(round);
  return round;
}
