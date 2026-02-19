import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import { openShare } from '../utils/share';
import * as MediaLibrary from 'expo-media-library';
import { formatDateDDMMMYYYY } from '../utils/date';
import { getTournamentById } from '../storage/tournaments';
import { getPlayersByTournamentId } from '../storage/players';
import { useTheme } from '../context/ThemeContext';

const CARD_WIDTH = 340;
const GOLD = '#f7dc6f';
const SILVER = '#e8e8e8';
const BRONZE = '#f0c080';

export function ShareScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const tournamentId = (route.params as { tournamentId: string }).tournamentId;
  const viewShotRef = useRef<ViewShot>(null);
  const [tournament, setTournament] = useState<{ name: string; date: string; rounds_total: number } | null>(null);
  const [standings, setStandings] = useState<{ name: string; points: number; buchholz: number }[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tData = await getTournamentById(tournamentId);
      const players = await getPlayersByTournamentId(tournamentId);
      if (tData) {
        setTournament({
          name: tData.name,
          date: tData.date,
          rounds_total: tData.rounds_total,
        });
        const sorted = [...players].sort(
          (a, b) => b.points - a.points || b.buchholz - a.buchholz
        );
        setPlayerCount(players.length);
        setStandings(
          sorted.slice(0, 10).map((p) => ({
            name: p.name,
            points: p.points,
            buchholz: p.buchholz,
          }))
        );
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

  const handleShare = async () => {
    if (!viewShotRef.current || !tournament) return;
    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        await openShare({
          url: Platform.OS === 'android' ? `file://${uri}` : uri,
          type: 'image/png',
          message: `Results from ${tournament.name} ♟`,
        });
      }
    } catch (e: unknown) {
      if ((e as { message?: string })?.message !== 'User did not share') {
        Alert.alert(t('common.error'), (e as Error).message);
      }
    }
  };

  const handleSaveToGallery = async () => {
    if (!viewShotRef.current || !tournament) return;
    setSaving(true);
    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('common.error'), t('share.permissionNeeded'));
          return;
        }
        const localUri = Platform.OS === 'android' ? `file://${uri}` : uri;
        await MediaLibrary.saveToLibraryAsync(localUri);
        setSnackMessage(t('share.saved'));
        setTimeout(() => setSnackMessage(null), 2500);
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigation.goBack();

  const styles = makeStyles(colors);

  if (loading || !tournament) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const winner = standings[0];
  const subtitle = `${formatDateDDMMMYYYY(tournament.date)}  ·  ${tournament.rounds_total} Rounds  ·  ${playerCount} Players`;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrap}>
          <View style={styles.phoneFrame}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', result: 'tmpfile', width: CARD_WIDTH }}
              style={styles.shotWrap}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardAppName}>♟ {t('appName')}</Text>
                  <Text style={styles.cardTitle}>{tournament.name}</Text>
                  <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.tcNum]}>{t('standings.rank')}</Text>
                    <Text style={[styles.th, styles.tcName]}>{t('standings.name')}</Text>
                    <Text style={[styles.th, styles.tcPts]}>{t('standings.points')}</Text>
                    <Text style={[styles.th, styles.tcBuch]}>{t('standings.buchholz')}</Text>
                  </View>
                  {standings.map((row, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor:
                            index === 0 ? GOLD : index === 1 ? SILVER : index === 2 ? BRONZE : index % 2 === 0 ? '#fff' : '#f5f5f5',
                        },
                      ]}
                    >
                      <Text style={styles.tdNum}>{index + 1}</Text>
                      <Text style={styles.tdName} numberOfLines={1}>{row.name}</Text>
                      <Text style={styles.tdPts}>{row.points}</Text>
                      <Text style={styles.tdBuch}>{row.buchholz}</Text>
                    </View>
                  ))}
                </View>
                {winner && (
                  <View style={styles.winnerBox}>
                    <Text style={styles.winnerText}>
                      {t('share.winner', { name: winner.name, points: winner.points })}
                    </Text>
                  </View>
                )}
                <Text style={styles.cardFooter}>{t('share.footer')}</Text>
              </View>
            </ViewShot>
          </View>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleShare}>
          <Text style={styles.btnPrimaryText}>{t('share.shareButton')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnOutlined}
          onPress={handleSaveToGallery}
          disabled={saving}
        >
          <Text style={styles.btnOutlinedText}>
            {saving ? '…' : t('share.saveButton')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnText} onPress={handleBack}>
          <Text style={styles.btnTextLabel}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {snackMessage ? (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    previewWrap: { alignItems: 'center', marginBottom: 24 },
    phoneFrame: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderRadius: 12,
      backgroundColor: '#333',
      padding: 10,
      transform: [{ scale: 0.9 }],
    },
    shotWrap: { backgroundColor: 'transparent' },
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.card,
      borderTopWidth: 4,
      borderTopColor: colors.primary,
      borderRadius: 8,
      overflow: 'hidden',
      paddingBottom: 16,
    },
    cardHeader: { padding: 16, paddingBottom: 12 },
    cardAppName: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    cardTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    cardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    table: { marginHorizontal: 16, marginTop: 8 },
    tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: colors.textSecondary },
    th: { fontWeight: '700', fontSize: 12, color: colors.textPrimary },
    tcNum: { width: 24 },
    tcName: { flex: 1 },
    tcPts: { width: 36, textAlign: 'right' },
    tcBuch: { width: 44, textAlign: 'right' },
    tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 0 },
    tdNum: { width: 24, fontSize: 12, color: colors.textPrimary },
    tdName: { flex: 1, fontSize: 12, color: colors.textPrimary },
    tdPts: { width: 36, fontSize: 12, textAlign: 'right', color: colors.textPrimary },
    tdBuch: { width: 44, fontSize: 12, textAlign: 'right', color: colors.textPrimary },
    winnerBox: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    winnerText: { color: colors.card, fontSize: 14, fontWeight: '700' },
    cardFooter: { fontSize: 10, color: colors.textSecondary, marginTop: 16, marginHorizontal: 16 },
    btnPrimary: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 10,
    },
    btnPrimaryText: { color: colors.card, fontSize: 17, fontWeight: '600' },
    btnOutlined: {
      borderWidth: 2,
      borderColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 10,
    },
    btnOutlinedText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
    btnText: { alignItems: 'center', paddingVertical: 12 },
    btnTextLabel: { color: colors.textSecondary, fontSize: 16 },
    snackbar: {
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
      backgroundColor: colors.textPrimary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    snackbarText: { color: colors.card, fontSize: 14 },
  });
}
