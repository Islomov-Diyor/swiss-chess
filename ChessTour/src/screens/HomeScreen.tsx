import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable, TouchableOpacity as GHTouchable } from 'react-native-gesture-handler';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import type { Tournament } from '../types';
import { getTournaments, deleteTournamentById } from '../storage/tournaments';
import { getPlayerCountsByTournamentIds } from '../storage/players';
import { formatDateDDMMMYYYY } from '../utils/date';

type HomeScreenNav = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNav;
};

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tournaments, setTournamentsState] = useState<Tournament[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await getTournaments();
      setTournamentsState(list);
      if (list.length > 0) {
        const counts = await getPlayerCountsByTournamentIds(list.map((x) => x.id));
        setPlayerCounts(counts);
      } else {
        setPlayerCounts({});
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDelete = useCallback(
    async (tournament: Tournament) => {
      if (Platform.OS === 'web') {
        // On web, show custom modal
        setTournamentToDelete(tournament);
        setConfirmModalVisible(true);
      } else {
        // On native, use Alert.alert
        Alert.alert(
          t('tournament.deleteConfirmTitle'),
          t('tournament.deleteConfirmMessage', { name: tournament.name }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteTournamentById(tournament.id);
                  await load();
                } catch (e) {
                  Alert.alert(t('common.error'), (e as Error).message);
                }
              },
            },
          ]
        );
      }
    },
    [t, load]
  );

  const confirmDelete = useCallback(async () => {
    if (!tournamentToDelete) return;
    setConfirmModalVisible(false);
    try {
      await deleteTournamentById(tournamentToDelete.id);
      await load();
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert(`${t('common.error')}: ${(e as Error).message}`);
      } else {
        Alert.alert(t('common.error'), (e as Error).message);
      }
    } finally {
      setTournamentToDelete(null);
    }
  }, [tournamentToDelete, load, t]);

  const cancelDelete = useCallback(() => {
    setConfirmModalVisible(false);
    setTournamentToDelete(null);
  }, []);

  const renderRightActions = useCallback(
    (tournament: Tournament) => () => (
      <TouchableOpacity
        style={[styles(colors).deleteButton]}
        onPress={() => handleDelete(tournament)}
        activeOpacity={0.8}
      >
        <Text style={styles(colors).deleteButtonText}>{t('common.delete')}</Text>
      </TouchableOpacity>
    ),
    [handleDelete, t, colors]
  );

  const isWeb = Platform.OS === 'web';

  const renderItem = useCallback(
    ({ item: tournament }: { item: Tournament }) => {
      const cardContent = (
        <View
          style={[
            styles(colors).card,
            { paddingRight: tournament.status === 'finished' ? 180 : 120 },
          ]}
        >
          <TouchableOpacity
            style={styles(colors).cardMain}
            onPress={() => navigation.navigate('TournamentOverview', { tournamentId: tournament.id })}
            activeOpacity={0.8}
          >
            <Text style={styles(colors).cardName} numberOfLines={1}>
              {tournament.name}
            </Text>
            <Text style={styles(colors).cardDate}>{formatDateDDMMMYYYY(tournament.date)}</Text>
            <Text style={styles(colors).cardMeta}>
              {t('home.playersRound', {
                count: playerCounts[tournament.id] ?? 0,
                current: tournament.rounds_completed,
                total: tournament.rounds_total,
              })}
            </Text>
          </TouchableOpacity>
          <View style={styles(colors).badgeDeleteRow} pointerEvents="box-none">
            <View
              style={[
                styles(colors).badge,
                tournament.status === 'active' ? styles(colors).badgeActive : styles(colors).badgeFinished,
              ]}
            >
              <Text style={styles(colors).badgeText}>
                {tournament.status === 'active' ? t('tournament.active') : t('tournament.finished')}
              </Text>
            </View>
            {tournament.status === 'finished' ? (
              isWeb ? (
                <Pressable
                  style={({ pressed }) => [
                    styles(colors).deleteOutlinedButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleDelete(tournament);
                  }}
                >
                  <Text style={styles(colors).deleteOutlinedText}>{t('common.delete')}</Text>
                </Pressable>
              ) : (
                <GHTouchable
                  style={styles(colors).deleteOutlinedButton}
                  onPress={() => handleDelete(tournament)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles(colors).deleteOutlinedText}>{t('common.delete')}</Text>
                </GHTouchable>
              )
            ) : null}
          </View>
        </View>
      );
      if (isWeb) return cardContent;
      return (
        <Swipeable
          renderRightActions={renderRightActions(tournament)}
          friction={2}
          rightThreshold={40}
        >
          {cardContent}
        </Swipeable>
      );
    },
    [navigation, playerCounts, renderRightActions, t, colors, handleDelete]
  );

  const listEmpty = (
    <View style={styles(colors).emptyState}>
      <Text style={styles(colors).emptyIcon}>♟</Text>
      <Text style={styles(colors).emptyTitle}>{t('home.empty')}</Text>
      <Text style={styles(colors).emptySub}>{t('home.emptySubtext')}</Text>
    </View>
  );

  if (loading && tournaments.length === 0) {
    return (
      <View style={[styles(colors).container, styles(colors).centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const s = styles(colors);
  const fabBottom = Platform.OS === 'web' ? 0 : insets.bottom + 8;
  const listPaddingBottom = Platform.OS === 'web' ? 100 : 100 + insets.bottom;
  return (
    <View style={s.container}>
      <FlatList
        data={tournaments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          tournaments.length === 0 ? s.scrollContentEmpty : s.scrollContent,
          { paddingBottom: listPaddingBottom },
        ]}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
      <TouchableOpacity
        style={[s.fab, { bottom: fabBottom }]}
        onPress={() => navigation.navigate('CreateTournament')}
        activeOpacity={0.9}
      >
        <Text style={s.fabText}>{t('home.newTournament')}</Text>
      </TouchableOpacity>

      {/* Custom confirmation modal for web */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <Pressable style={s.modalOverlay} onPress={cancelDelete}>
          <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t('tournament.deleteConfirmTitle')}</Text>
            <Text style={s.modalMessage}>
              {tournamentToDelete && t('tournament.deleteConfirmMessage', { name: tournamentToDelete.name })}
            </Text>
            <View style={s.modalButtons}>
              <Pressable
                style={({ pressed }) => [s.modalButtonCancel, pressed && s.modalButtonPressed]}
                onPress={cancelDelete}
              >
                <Text style={s.modalButtonCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.modalButtonDelete, pressed && s.modalButtonPressed]}
                onPress={confirmDelete}
              >
                <Text style={s.modalButtonDeleteText}>{t('common.delete')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function styles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    scrollContentEmpty: { flexGrow: 1, padding: 16, paddingBottom: 100 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
    emptySub: { fontSize: 16, color: colors.textSecondary },
    card: {
      position: 'relative',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    cardMain: { flex: 1 },
    cardName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    badgeDeleteRow: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      zIndex: 100,
    },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    deleteOutlinedButton: {
      borderColor: '#c0392b',
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: 'transparent',
      cursor: 'pointer',
      zIndex: 10,
    },
    deleteOutlinedText: { fontSize: 13, fontWeight: '600', color: '#c0392b' },
    badgeActive: { backgroundColor: colors.success },
    badgeFinished: { backgroundColor: colors.badgeFinished },
    badgeText: { color: colors.card, fontSize: 12, fontWeight: '600' },
    cardDate: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
    cardMeta: { fontSize: 14, color: colors.textSecondary },
    deleteButton: {
      backgroundColor: colors.danger,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      borderRadius: 12,
      marginBottom: 12,
    },
    deleteButtonText: { color: colors.card, fontWeight: '600', fontSize: 14 },
    fab: {
      position: 'absolute',
      left: 0,
      right: 0,
      // Lift the button above Android system nav bar / gesture area
      bottom: 0,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabText: { color: colors.card, fontSize: 17, fontWeight: '600' },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 24,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButtonCancel: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.textSecondary,
    },
    modalButtonDelete: {
      flex: 1,
      backgroundColor: '#c0392b',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    modalButtonPressed: {
      opacity: 0.7,
    },
    modalButtonCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    modalButtonDeleteText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
  });
}
