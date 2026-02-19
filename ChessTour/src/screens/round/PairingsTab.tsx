import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';
import type { Pairing, PairingResult, Player } from '../../types';
import { colors } from '../../theme/colors';
import { useRound } from '../../context/RoundContext';
import { updateRound } from '../../storage/rounds';
import { applyRoundResults, recalculateBuchholz, validateNoRepeatOpponents } from '../../services/roundResults';
import { generateSwissRound } from '../../services/generateSwissRound';
import { addRound } from '../../storage/rounds';
import { replacePlayersForTournament } from '../../storage/players';
import { updateTournament } from '../../storage/tournaments';

type Nav = StackNavigationProp<RootStackParamList, 'Round'>;

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? '—';
}

function playerRating(players: Player[], id: string): number | null {
  return players.find((p) => p.id === id)?.rating ?? null;
}

export function PairingsTab() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { tournamentId, roundNumber, readOnly, tournament, round, players, refresh } = useRound();
  const [busy, setBusy] = useState(false);

  if (!round || !tournament) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>…</Text>
      </View>
    );
  }

  const nonByePairings = round.pairings.filter((p) => p.black_player_id != null);
  const resultsEntered = nonByePairings.filter((p) => p.result != null).length;
  const totalResults = nonByePairings.length;
  const allEntered = totalResults > 0 && resultsEntered === totalResults;
  const isLastRound = roundNumber >= tournament.rounds_total;

  const handleResultPress = async (pairing: Pairing, newResult: PairingResult) => {
    if (pairing.black_player_id === null) return;
    const current = pairing.result;
    if (current === newResult) {
      Alert.alert(
        t('round.changeResult'),
        undefined,
        [
          { text: t('home.cancel'), style: 'cancel' },
          {
            text: t('home.yes'),
            onPress: async () => {
              try {
                const updated = {
                  ...round,
                  pairings: round.pairings.map((pa) =>
                    pa.id === pairing.id ? { ...pa, result: null } : pa
                  ),
                };
                await updateRound(updated);
                await refresh();
              } catch (e) {
                Alert.alert(t('common.error'), (e as Error).message);
              }
            },
          },
        ]
      );
      return;
    }
    try {
      const updated = {
        ...round,
        pairings: round.pairings.map((pa) =>
          pa.id === pairing.id ? { ...pa, result: newResult } : pa
        ),
      };
      await updateRound(updated);
      await refresh();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  };

  const handleNextOrFinish = async () => {
    if (!allEntered) {
      Alert.alert(t('round.enterAllResults'));
      return;
    }
    setBusy(true);
    try {
      const withResults = applyRoundResults(players, round);
      const withBuchholz = recalculateBuchholz(withResults);

      if (isLastRound) {
        const tourUpdated = {
          ...tournament,
          status: 'finished' as const,
          rounds_completed: tournament.rounds_total,
        };
        await replacePlayersForTournament(tournamentId, withBuchholz);
        await updateTournament(tourUpdated);
        const sorted = [...withBuchholz].sort(
          (a, b) => b.points - a.points || b.buchholz - a.buchholz
        );
        const winner = sorted[0];
        navigation.navigate('TournamentOverview', { tournamentId });
        Alert.alert(
          t('round.tournamentComplete', { name: winner?.name ?? '—' })
        );
      } else {
        // 1) Persist opponents_played immediately so it's never lost between rounds
        await replacePlayersForTournament(tournamentId, withBuchholz);
        await updateRound({ ...round, status: 'completed' });
        const nextRoundNumber = roundNumber + 1;
        const newRound = generateSwissRound(
          tournamentId,
          withBuchholz,
          nextRoundNumber
        );
        // 2) Validate no repeat opponents before saving the new round
        const { valid, violations } = validateNoRepeatOpponents(withBuchholz, newRound);
        if (!valid && violations.length > 0) {
          if (__DEV__) {
            console.warn(
              '[Swiss] Repeat opponent(s) in generated round:',
              violations.map((v) => `${v.whiteId} vs ${v.blackId}`)
            );
          }
        }
        await addRound(newRound);
        const tourUpdated = {
          ...tournament,
          rounds_completed: roundNumber,
        };
        await updateTournament(tourUpdated);
        navigation.navigate('Round', {
          tournamentId,
          roundNumber: nextRoundNumber,
        });
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renderPairing = ({ item: pairing }: { item: Pairing }) => {
    const isBye = pairing.black_player_id === null;
    if (isBye) {
      const name = playerName(players, pairing.white_player_id);
      return (
        <View style={styles.byeCard}>
          <Text style={styles.byeLabel}>{t('round.bye')}</Text>
          <Text style={styles.byeName}>{name}</Text>
          <Text style={styles.byePoint}>{t('round.onePointAwarded')}</Text>
        </View>
      );
    }
    const blackId = pairing.black_player_id!;
    const whiteName = playerName(players, pairing.white_player_id);
    const blackName = playerName(players, blackId);
    const whiteRating = playerRating(players, pairing.white_player_id);
    const blackRating = playerRating(players, blackId);
    const res = pairing.result;

    return (
      <View style={styles.card}>
        <Text style={styles.boardLabel}>
          {t('round.boardX', { num: pairing.board_number })}
        </Text>
        <View style={styles.namesRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.playerName} numberOfLines={1}>
              {whiteName}
            </Text>
            {whiteRating != null && (
              <Text style={styles.rating}>{whiteRating}</Text>
            )}
          </View>
          <Text style={styles.vs}>{t('round.vs')}</Text>
          <View style={styles.nameBlock}>
            <Text style={[styles.playerName, styles.playerNameRight]} numberOfLines={1}>
              {blackName}
            </Text>
            {blackRating != null && (
              <Text style={[styles.rating, styles.ratingRight]}>{blackRating}</Text>
            )}
          </View>
        </View>
        {readOnly ? (
          <Text style={styles.resultReadOnly}>
            {res === '1-0' ? t('round.result10') : res === '0.5-0.5' ? t('round.result05') : res === '0-1' ? t('round.result01') : '—'}
          </Text>
        ) : (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.resultBtn, res === '1-0' && styles.resultBtnSelected]}
              onPress={() => handleResultPress(pairing, '1-0')}
            >
              <Text style={[styles.resultBtnText, res === '1-0' && styles.resultBtnTextSelected]}>
                {t('round.result10')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, res === '0.5-0.5' && styles.resultBtnSelected]}
              onPress={() => handleResultPress(pairing, '0.5-0.5')}
            >
              <Text style={[styles.resultBtnText, res === '0.5-0.5' && styles.resultBtnTextSelected]}>
                {t('round.result05')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, res === '0-1' && styles.resultBtnSelected]}
              onPress={() => handleResultPress(pairing, '0-1')}
            >
              <Text style={[styles.resultBtnText, res === '0-1' && styles.resultBtnTextSelected]}>
                {t('round.result01')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!readOnly && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {t('round.resultsEntered', { entered: resultsEntered, total: totalResults })}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${totalResults ? (resultsEntered / totalResults) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>
      )}

      <FlatList
        data={round.pairings}
        renderItem={renderPairing}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.listContent, readOnly && styles.listContentReadOnly]}
      />

      {!readOnly && (
        <TouchableOpacity
          style={[
            styles.nextButton,
            !allEntered && styles.nextButtonDisabled,
            busy && styles.nextButtonDisabled,
          ]}
          onPress={handleNextOrFinish}
          disabled={!allEntered || busy}
        >
          <Text
            style={[
              styles.nextButtonText,
              !allEntered && styles.nextButtonTextDisabled,
            ]}
          >
            {isLastRound ? t('round.finishTournament') : t('round.nextRound')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: colors.textSecondary },
  progressSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  progressText: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  listContentReadOnly: { paddingBottom: 24 },
  resultReadOnly: { fontSize: 15, color: colors.textSecondary, marginTop: 6 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  boardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameBlock: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  playerNameRight: { textAlign: 'right' },
  rating: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ratingRight: { textAlign: 'right' },
  vs: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  resultBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  resultBtnSelected: { backgroundColor: colors.primary },
  resultBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  resultBtnTextSelected: { color: colors.card },
  byeCard: {
    backgroundColor: colors.badgeFinished,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    opacity: 0.9,
  },
  byeLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  byeName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  byePoint: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  nextButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: { backgroundColor: colors.badgeFinished },
  nextButtonText: { color: colors.card, fontSize: 17, fontWeight: '600' },
  nextButtonTextDisabled: { color: colors.card, opacity: 0.9 },
});
