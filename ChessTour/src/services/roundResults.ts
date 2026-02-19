import type { Player, Round, PairingResult } from '../types';

function pointsForResult(result: PairingResult, isWhite: boolean): number {
  if (!result) return 0;
  if (result === '1-0') return isWhite ? 1 : 0;
  if (result === '0-1') return isWhite ? 0 : 1;
  return 0.5;
}

/** Live points for display: stored points + points from current round pairings (so far) */
export function livePointsForPlayer(playerId: string, round: Round, basePoints: number): number {
  for (const p of round.pairings) {
    if (p.white_player_id === playerId) {
      return basePoints + pointsForResult(p.result, true);
    }
    if (p.black_player_id === playerId) {
      return basePoints + pointsForResult(p.result, false);
    }
  }
  return basePoints;
}

/** Apply round results to players: points, w/d/l, color_history, opponents_played */
export function applyRoundResults(players: Player[], round: Round): Player[] {
  const byId = new Map(players.map((p) => [p.id, { ...p }]));
  for (const pairing of round.pairings) {
    const white = byId.get(pairing.white_player_id);
    const black = pairing.black_player_id ? byId.get(pairing.black_player_id) : null;
    if (pairing.black_player_id === null) {
      // Bye: 1 point to total, but do NOT count as a win in W column
      if (white) {
        white.color_history = [...white.color_history, 'bye'];
        white.points += 1;
      }
    } else {
      if (white) {
        white.color_history = [...white.color_history, 'white'];
        white.opponents_played = [...white.opponents_played, black!.id];
      }
      if (black) {
        black.color_history = [...black.color_history, 'black'];
        black.opponents_played = [...black.opponents_played, pairing.white_player_id];
      }
      const result = pairing.result;
      if (result === '1-0') {
        if (white) {
          white.points += 1;
          white.wins += 1;
        }
        if (black) black.losses += 1;
      } else if (result === '0-1') {
        if (black) {
          black.points += 1;
          black.wins += 1;
        }
        if (white) white.losses += 1;
      } else if (result === '0.5-0.5') {
        if (white) {
          white.points += 0.5;
          white.draws += 1;
        }
        if (black) {
          black.points += 0.5;
          black.draws += 1;
        }
      }
    }
  }
  return Array.from(byId.values());
}

/** Recalculate Buchholz: sum of current points of all opponents played */
export function recalculateBuchholz(players: Player[]): Player[] {
  const byId = new Map(players.map((p) => [p.id, { ...p, buchholz: 0 }]));
  for (const p of byId.values()) {
    let sum = 0;
    for (const oppId of p.opponents_played) {
      const opp = byId.get(oppId);
      if (opp) sum += opp.points;
    }
    p.buchholz = sum;
  }
  return Array.from(byId.values());
}

/**
 * Validate that no pairing in the round is a repeat opponent.
 * Returns { valid, violations } where violations list pairings that are repeats.
 */
export function validateNoRepeatOpponents(
  players: Player[],
  round: Round
): { valid: boolean; violations: Array<{ whiteId: string; blackId: string }> } {
  const byId = new Map(players.map((p) => [p.id, p]));
  const violations: Array<{ whiteId: string; blackId: string }> = [];
  for (const pairing of round.pairings) {
    if (pairing.black_player_id === null) continue;
    const white = byId.get(pairing.white_player_id);
    const black = byId.get(pairing.black_player_id);
    if (!white || !black) continue;
    const alreadyPlayed =
      white.opponents_played.includes(black.id) || black.opponents_played.includes(white.id);
    if (alreadyPlayed) {
      violations.push({ whiteId: white.id, blackId: black.id });
    }
  }
  return { valid: violations.length === 0, violations };
}

/** Add new round's pairings to players' color_history and opponents_played (no score change) */
export function addRoundPairingsToPlayers(players: Player[], round: Round): Player[] {
  const byId = new Map(players.map((p) => [p.id, { ...p }]));
  for (const pairing of round.pairings) {
    const white = byId.get(pairing.white_player_id);
    const black = pairing.black_player_id ? byId.get(pairing.black_player_id) : null;
    if (pairing.black_player_id === null) {
      if (white) white.color_history = [...white.color_history, 'bye'];
    } else {
      if (white) {
        white.color_history = [...white.color_history, 'white'];
        white.opponents_played = [...white.opponents_played, black!.id];
      }
      if (black) {
        black.color_history = [...black.color_history, 'black'];
        black.opponents_played = [...black.opponents_played, pairing.white_player_id];
      }
    }
  }
  return Array.from(byId.values());
}
