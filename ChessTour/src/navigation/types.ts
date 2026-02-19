import type { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  CreateTournament: undefined;
  Players: { tournamentId: string };
  TournamentOverview: { tournamentId: string };
  Round: { tournamentId: string; roundNumber?: number; readOnly?: boolean; initialTab?: 'Pairings' | 'Standings' };
  Share: { tournamentId: string };
  Settings: undefined;
  About: undefined;
};

export type RoundTabParamList = {
  Pairings: { tournamentId: string };
  Standings: { tournamentId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
