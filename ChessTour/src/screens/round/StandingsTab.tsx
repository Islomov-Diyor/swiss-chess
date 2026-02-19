import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { Player } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useRound } from '../../context/RoundContext';
import { livePointsForPlayer } from '../../services/roundResults';

const GOLD = '#f7dc6f';
const SILVER = '#e8e8e8';
const BRONZE = '#f0c080';

type RowPlayer = Player & { livePoints: number };

export function StandingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { tournament, round, players, refresh } = useRound();
  const styles = makeStyles(colors);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!tournament) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>…</Text>
      </View>
    );
  }

  const withLive: RowPlayer[] = round
    ? players.map((p) => ({
        ...p,
        livePoints: livePointsForPlayer(p.id, round, p.points),
      }))
    : players.map((p) => ({ ...p, livePoints: p.points }));

  const sorted = [...withLive].sort(
    (a, b) => b.livePoints - a.livePoints || b.buchholz - a.buchholz
  );

  const isFinished = tournament.status === 'finished';

  const rowBg = (index: number) => {
    if (index === 0) return GOLD;
    if (index === 1) return SILVER;
    if (index === 2) return BRONZE;
    return index % 2 === 0 ? colors.card : colors.background;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.cellNum, styles.headerCell]}>{t('standings.rank')}</Text>
            <Text style={[styles.cell, styles.cellName, styles.headerCell]}>
              {t('standings.name')}
            </Text>
            <Text style={[styles.cell, styles.cellPts, styles.headerCell]}>
              {t('standings.points')}
            </Text>
            <Text style={[styles.cell, styles.cellBuch, styles.headerCell]}>
              {t('standings.buchholz')}
            </Text>
            <Text style={[styles.cell, styles.cellW, styles.headerCell]}>
              {t('standings.wins')}
            </Text>
            <Text style={[styles.cell, styles.cellD, styles.headerCell]}>
              {t('standings.draws')}
            </Text>
            <Text style={[styles.cell, styles.cellL, styles.headerCell]}>
              {t('standings.losses')}
            </Text>
          </View>
          {sorted.map((p, index) => (
            <View
              key={p.id}
              style={[styles.dataRow, { backgroundColor: rowBg(index) }]}
            >
              <Text style={[styles.cell, styles.cellNum]}>{index + 1}</Text>
              <Text
                style={[
                  styles.cell,
                  styles.cellName,
                  index < 3 && styles.boldName,
                ]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
              <Text style={[styles.cell, styles.cellPts]}>{p.livePoints}</Text>
              <Text style={[styles.cell, styles.cellBuch]}>{p.buchholz}</Text>
              <Text style={[styles.cell, styles.cellW]}>{p.wins}</Text>
              <Text style={[styles.cell, styles.cellD]}>{p.draws}</Text>
              <Text style={[styles.cell, styles.cellL]}>{p.losses}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isFinished
            ? t('standings.final')
            : t('standings.live', {
                current: tournament.rounds_completed + (round ? 1 : 0),
                total: tournament.rounds_total,
              })}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 18, color: colors.textSecondary },
    scrollContent: { padding: 16, paddingBottom: 24 },
    table: { minWidth: '100%' },
    headerRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.textSecondary,
      backgroundColor: colors.card,
    },
    headerCell: { fontWeight: '700', color: colors.textPrimary },
    dataRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    cell: { fontSize: 14, color: colors.textPrimary },
    cellNum: { width: 28 },
    cellName: { flex: 1, minWidth: 80 },
    cellPts: { width: 36, textAlign: 'right' },
    cellBuch: { width: 40, textAlign: 'right' },
    cellW: { width: 24, textAlign: 'center' },
    cellD: { width: 24, textAlign: 'center' },
    cellL: { width: 24, textAlign: 'center' },
    boldName: { fontWeight: '700' },
    footer: { padding: 16, paddingTop: 8 },
    footerText: { fontSize: 13, color: colors.textSecondary },
  });
}
