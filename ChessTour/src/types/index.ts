export type TournamentStatus = 'active' | 'finished';

export interface Tournament {
  id: string;
  name: string;
  date: string; // ISO
  rounds_total: number;
  rounds_completed: number;
  time_control: string;
  status: TournamentStatus;
  created_at: string;
}

export type ColorHistoryEntry = 'white' | 'black' | 'bye';

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  rating: number | null;
  points: number;
  buchholz: number;
  color_history: ColorHistoryEntry[];
  opponents_played: string[];
  had_bye: boolean;
  wins: number;
  draws: number;
  losses: number;
}

export type PairingResult = '1-0' | '0-1' | '0.5-0.5' | null;

export interface Pairing {
  id: string;
  board_number: number;
  white_player_id: string;
  black_player_id: string | null;
  result: PairingResult;
}

export type RoundStatus = 'active' | 'completed';

export interface Round {
  id: string;
  tournament_id: string;
  round_number: number;
  status: RoundStatus;
  pairings: Pairing[];
}

export type LanguageCode = 'en' | 'ru' | 'uz';
