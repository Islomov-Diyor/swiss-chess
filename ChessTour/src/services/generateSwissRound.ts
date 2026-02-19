import { v4 as uuid } from 'uuid';
import type { Player, Round, Pairing, ColorHistoryEntry } from '../types';

function colorsCompatible(p1: Player, p2: Player): boolean {
  const last2 = (p: Player): ColorHistoryEntry[] => {
    const colors = p.color_history.filter((c) => c !== 'bye');
    return colors.slice(-2);
  };
  const a = last2(p1);
  const b = last2(p2);
  if (a.length < 2 || b.length < 2) return true;
  const sameColor = (arr: ColorHistoryEntry[]) =>
    arr[0] === arr[1] && (arr[0] === 'white' || arr[0] === 'black');
  if (sameColor(a) && sameColor(b) && a[0] === b[0]) return false;
  return true;
}

function countWhite(p: Player): number {
  return p.color_history.filter((c) => c === 'white').length;
}

export function generateSwissRound(
  tournamentId: string,
  players: Player[],
  roundNumber: number
): Round {
  let activePlayers: Player[];
  let byeCandidate: Player | null = null;
  const updatedPlayers = [...players];

  if (players.length % 2 === 1) {
    const byPoints = [...players].sort(
      (a, b) => b.points - a.points || b.buchholz - a.buchholz
    );
    let lastWithoutBye: Player | null = null;
    for (let i = byPoints.length - 1; i >= 0; i--) {
      if (!byPoints[i].had_bye) {
        lastWithoutBye = byPoints[i];
        break;
      }
    }
    byeCandidate = lastWithoutBye ?? byPoints[byPoints.length - 1];
    const byeIdx = updatedPlayers.findIndex((p) => p.id === byeCandidate!.id);
    updatedPlayers[byeIdx] = {
      ...byeCandidate,
      had_bye: true,
      color_history: [...byeCandidate.color_history, 'bye'],
    };
    byeCandidate = updatedPlayers[byeIdx];
    activePlayers = updatedPlayers.filter((p) => p.id !== byeCandidate!.id);
  } else {
    activePlayers = [...players];
  }

  const sorted = [...activePlayers].sort(
    (a, b) => b.points - a.points || b.buchholz - a.buchholz
  );

  const unpaired = sorted.map((p) => ({ ...p }));
  const pairings: Pairing[] = [];
  let boardNumber = 1;

  // Priority: 1) Never repeat opponent (unless impossible), 2) Balance colors, 3) Same score group
  while (unpaired.length >= 2) {
    const player1 = unpaired[0];
    const rest = unpaired.slice(1);

    const nonRepeat = rest.filter((p) => !player1.opponents_played.includes(p.id));
    const candidates = nonRepeat.length > 0 ? nonRepeat : rest;

    // Among candidates, prefer color-compatible, then similar score (same score group)
    const scoreDiff = (p: Player) => Math.abs(p.points - player1.points);
    const colorCompatible = (p: Player) => colorsCompatible(player1, p);
    candidates.sort((a, b) => {
      const aCompat = colorCompatible(a) ? 1 : 0;
      const bCompat = colorCompatible(b) ? 1 : 0;
      if (bCompat !== aCompat) return bCompat - aCompat;
      return scoreDiff(a) - scoreDiff(b);
    });
    const opponent = candidates[0];

    const opponentIdx = unpaired.findIndex((p) => p.id === opponent.id);
    const p1Whites = countWhite(player1);
    const p2Whites = countWhite(opponent);
    const white = p1Whites <= p2Whites ? player1 : opponent;
    const black = p1Whites <= p2Whites ? opponent : player1;

    pairings.push({
      id: uuid(),
      board_number: boardNumber++,
      white_player_id: white.id,
      black_player_id: black.id,
      result: null,
    });

    unpaired.splice(opponentIdx, 1);
    unpaired.splice(0, 1);
  }

  if (byeCandidate) {
    pairings.push({
      id: uuid(),
      board_number: boardNumber,
      white_player_id: byeCandidate.id,
      black_player_id: null,
      result: '1-0',
    });
  }

  return {
    id: uuid(),
    tournament_id: tournamentId,
    round_number: roundNumber,
    status: 'active',
    pairings,
  };
}
