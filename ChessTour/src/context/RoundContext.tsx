import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Player, Round, Tournament } from '../types';
import { getTournamentById } from '../storage/tournaments';
import { getRoundByTournamentIdAndNumber } from '../storage/rounds';
import { getPlayersByTournamentId } from '../storage/players';

type RoundContextValue = {
  tournamentId: string;
  roundNumber: number;
  readOnly: boolean;
  tournament: Tournament | null;
  round: Round | null;
  players: Player[];
  refresh: () => Promise<void>;
};

const RoundContext = createContext<RoundContextValue | null>(null);

export function useRound() {
  const ctx = useContext(RoundContext);
  if (!ctx) throw new Error('useRound must be used within RoundProvider');
  return ctx;
}

type RoundProviderProps = {
  tournamentId: string;
  roundNumber: number;
  readOnly?: boolean;
  children: React.ReactNode;
};

export function RoundProvider({ tournamentId, roundNumber, readOnly = false, children }: RoundProviderProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const refresh = useCallback(async () => {
    const [t, r, p] = await Promise.all([
      getTournamentById(tournamentId),
      getRoundByTournamentIdAndNumber(tournamentId, roundNumber),
      getPlayersByTournamentId(tournamentId),
    ]);
    setTournament(t ?? null);
    setRound(r ?? null);
    setPlayers(p);
  }, [tournamentId, roundNumber]);

  const value: RoundContextValue = {
    tournamentId,
    roundNumber,
    readOnly,
    tournament,
    round,
    players,
    refresh,
  };

  return <RoundContext.Provider value={value}>{children}</RoundContext.Provider>;
}
