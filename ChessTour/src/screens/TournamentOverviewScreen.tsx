import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackScreenProps, RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { formatDateDDMMMYYYY } from '../utils/date';
import { getTournamentById } from '../storage/tournaments';
import { getPlayersByTournamentId } from '../storage/players';
import { getRoundsByTournamentId } from '../storage/rounds';
import type { Tournament } from '../types';

type Nav = StackNavigationProp<RootStackParamList, 'TournamentOverview'>;

export function TournamentOverviewScreen({ route }: RootStackScreenProps<'TournamentOverview'>) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { tournamentId } = route.params;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [rounds, setRounds] = useState<{ roundNumber: number; games: number; completed: boolean }[]>([]);
  const [leaderName, setLeaderName] = useState<string | null>(null);
  const [leaderPoints, setLeaderPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tData, players, roundsList] = await Promise.all([
      getTournamentById(tournamentId),
      getPlayersByTournamentId(tournamentId),
      getRoundsByTournamentId(tournamentId),
    ]);
    if (tData) {
      setTournament(tData);
      setPlayerCount(players.length);
      const sorted = [...players].sort(
        (a, b) => b.points - a.points || b.buchholz - a.buchholz
      );
      if (sorted.length > 0) {
        setLeaderName(sorted[0].name);
        setLeaderPoints(sorted[0].points);
      } else {
        setLeaderName(null);
        setLeaderPoints(0);
      }
      const roundRows: { roundNumber: number; games: number; completed: boolean }[] = [];
      for (let i = 1; i <= tData.rounds_completed; i++) {
        const r = roundsList.find((x) => x.round_number === i);
        const games = r ? r.pairings.filter((p) => p.black_player_id != null).length : 0;
        roundRows.push({ roundNumber: i, games, completed: true });
      }
      if (tData.status === 'active' && tData.rounds_completed < tData.rounds_total) {
        roundRows.push({
          roundNumber: tData.rounds_completed + 1,
          games: 0,
          completed: false,
        });
      }
      setRounds(roundRows);
    }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRoundPress = (roundNumber: number, completed: boolean) => {
    navigation.navigate('Round', {
      tournamentId,
      roundNumber,
      readOnly: completed,
    });
  };

  const handleContinue = () => {
    if (!tournament) return;
    const currentRound = tournament.rounds_completed + 1;
    navigation.navigate('Round', { tournamentId, roundNumber: currentRound, readOnly: false });
  };

  const handleViewStandings = () => {
    navigation.navigate('Round', {
      tournamentId,
      roundNumber: tournament?.rounds_completed ?? 1,
      readOnly: true,
      initialTab: 'Standings',
    });
  };

  const handleShareResults = () => {
    navigation.navigate('Share', { tournamentId });
  };

  if (loading || !tournament) {
    return (
      <View style={[makeStyles(colors).centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const s = makeStyles(colors);
  const subtitle = [formatDateDDMMMYYYY(tournament.date), tournament.time_control].filter(Boolean).join('  ·  ');

  const listHeader = (
    <>
      <Text style={s.title} numberOfLines={2}>{tournament.name}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      <View style={s.badgeWrap}>
        <View
          style={[
            s.badge,
            tournament.status === 'active' ? s.badgeActive : s.badgeFinished,
          ]}
        >
          <Text style={s.badgeText}>
            {tournament.status === 'active' ? t('tournament.active') : t('tournament.finished')}
          </Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{playerCount}</Text>
          <Text style={s.statLabel}>{t('overview.players')}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{tournament.rounds_completed} / {tournament.rounds_total}</Text>
          <Text style={s.statLabel}>{t('overview.roundsDone')}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue} numberOfLines={1}>{leaderName ?? t('overview.noLeader')}</Text>
          <Text style={s.statLabel}>{t('overview.leader')}{leaderName ? ` · ${leaderPoints} pts` : ''}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>{t('overview.roundsHistory')}</Text>
    </>
  );

  return (
    <View style={s.container}>
      <FlatList
        data={rounds}
        keyExtractor={(item) => String(item.roundNumber)}
        ListHeaderComponent={listHeader}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: { roundNumber, games, completed } }) => (
          <TouchableOpacity
            style={s.roundRow}
            onPress={() => handleRoundPress(roundNumber, completed)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                s.roundRowText,
                !completed && s.roundRowTextActive,
              ]}
            >
              {completed
                ? t('overview.roundXGames', { num: roundNumber, count: games })
                : t('overview.roundXActive', { num: roundNumber })}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={<View style={s.bottomSpacer} />}
      />

      <View style={s.buttons}>
        {tournament.status === 'active' ? (
          <TouchableOpacity style={s.btnPrimary} onPress={handleContinue}>
            <Text style={s.btnPrimaryText}>{t('overview.continueTournament')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={s.btnOutlined} onPress={handleViewStandings}>
              <Text style={s.btnOutlinedText}>{t('overview.viewFinalStandings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnPrimary} onPress={handleShareResults}>
              <Text style={s.btnPrimaryText}>{t('overview.shareResults')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 24 },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
    badgeWrap: { marginBottom: 20 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeActive: { backgroundColor: colors.success },
    badgeFinished: { backgroundColor: colors.badgeFinished },
    badgeText: { color: colors.card, fontSize: 13, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
    roundRow: {
      backgroundColor: colors.card,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    roundRowText: { fontSize: 15, color: colors.textSecondary },
    roundRowTextActive: { color: colors.primary, fontWeight: '600' },
    bottomSpacer: { height: 24 },
    buttons: { padding: 16, paddingTop: 12, backgroundColor: colors.background, gap: 10 },
    btnPrimary: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnPrimaryText: { color: colors.card, fontSize: 17, fontWeight: '600' },
    btnOutlined: {
      borderWidth: 2,
      borderColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnOutlinedText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  });
}
