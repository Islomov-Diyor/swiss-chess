import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Swipeable } from 'react-native-gesture-handler';
import { v4 as uuid } from 'uuid';
import type { RootStackParamList } from '../navigation/types';
import type { Player, Tournament } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getTournamentById } from '../storage/tournaments';
import {
  getPlayersByTournamentId,
  addPlayer,
  addPlayersBulk,
  updatePlayer,
  deletePlayerById,
} from '../storage/players';
import { generateRound1 } from '../services/generateRound1';

const MAX_PLAYERS = 64;

type Nav = StackNavigationProp<RootStackParamList, 'Players'>;

export function PlayersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const tournamentId = (route.params as { tournamentId: string }).tournamentId;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [sheetRating, setSheetRating] = useState('');
  const [sheetNameError, setSheetNameError] = useState('');
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    const [tData, pList] = await Promise.all([
      getTournamentById(tournamentId),
      getPlayersByTournamentId(tournamentId),
    ]);
    if (tData) setTournament(tData);
    setPlayers(pList);
  }, [tournamentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setBulkModalVisible(true)}
            style={styles.bulkImportButton}
          >
            <Text style={styles.bulkImportText}>{t('players.bulkImport')}</Text>
          </TouchableOpacity>
          <View style={[styles.badge, players.length >= MAX_PLAYERS ? styles.badgeRed : players.length >= 55 ? styles.badgeOrange : styles.badgeNormal]}>
            <Text style={styles.badgeText}>{t('players.playerCountBadge', { count: players.length })}</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, players.length, t]);

  const canAddPlayer = players.length < MAX_PLAYERS;
  const styles = makeStyles(colors);

  const openAddSheet = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
      setSheetName(player.name);
      setSheetRating(player.rating != null ? String(player.rating) : '');
    } else {
      setEditingPlayer(null);
      setSheetName('');
      setSheetRating('');
    }
    setSheetNameError('');
    setAddSheetVisible(true);
  };

  const closeAddSheet = () => {
    setAddSheetVisible(false);
    setEditingPlayer(null);
    setSheetName('');
    setSheetRating('');
    setSheetNameError('');
  };

  const handleAddOrUpdatePlayer = async () => {
    const name = sheetName.trim();
    if (!name) {
      setSheetNameError(t('createTournament.tournamentNameRequired'));
      return;
    }
    const rating = sheetRating.trim() ? parseInt(sheetRating, 10) : null;
    const ratingNum = Number.isNaN(rating) ? null : rating;

    try {
      if (editingPlayer) {
        await updatePlayer({ ...editingPlayer, name, rating: ratingNum });
        closeAddSheet();
        await load();
      } else {
        await addPlayer({
          id: uuid(),
          tournament_id: tournamentId,
          name,
          rating: ratingNum,
        });
        setSheetName('');
        setSheetRating('');
        setSheetNameError('');
        await load();
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return;
    if (lines.length + players.length > MAX_PLAYERS) {
      Alert.alert(t('common.error'), t('players.maxPlayersExceeded', { max: MAX_PLAYERS }));
      return;
    }
    const newPlayers = lines.map((name) => ({
      id: uuid(),
      tournament_id: tournamentId,
      name,
      rating: null as number | null,
    }));
    try {
      await addPlayersBulk(newPlayers);
      setBulkText('');
      setBulkModalVisible(false);
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  };

  const bulkLines = bulkText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const bulkCount = bulkLines.length;

  const handleDeletePlayer = (player: Player) => {
    Alert.alert(
      t('players.deletePlayerConfirm'),
      undefined,
      [
        { text: t('home.cancel'), style: 'cancel' },
        {
          text: t('home.delete'),
          style: 'destructive',
          onPress: async () => {
            await deletePlayerById(player.id);
            await load();
          },
        },
      ]
    );
  };

  const handleStartTournament = async () => {
    if (players.length < 2) return;
    setStarting(true);
    try {
      await generateRound1(tournamentId, players);
      navigation.navigate('Round', { tournamentId, roundNumber: 1 });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const renderRightActions = (player: Player) => () => (
    <TouchableOpacity
      style={styles.deleteRowButton}
      onPress={() => handleDeletePlayer(player)}
    >
      <Text style={styles.deleteRowText}>🗑</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, index }: { item: Player; index: number }) => (
    <Swipeable renderRightActions={renderRightActions(item)} friction={2} rightThreshold={40}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => openAddSheet(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowNum}>{index + 1}</Text>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowRating}>{item.rating != null ? item.rating : t('players.ratingDash')}</Text>
        <Text style={styles.rowIcon}>🗑</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      {tournament ? (
        <Text style={styles.subheader} numberOfLines={1}>{tournament.name}</Text>
      ) : null}

      {players.length % 2 === 1 && players.length > 0 ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠ {t('players.oddPlayersWarning')}</Text>
        </View>
      ) : null}

      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>{t('players.addPlayers')}</Text>
            <Text style={styles.emptyListSub}>{t('players.fullName')}</Text>
          </View>
        }
      />

      {canAddPlayer && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openAddSheet()}
          activeOpacity={0.9}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add/Edit Player bottom sheet */}
      <Modal visible={addSheetVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeAddSheet} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.sheetClose} onPress={closeAddSheet}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>{editingPlayer ? t('players.editPlayer') : t('players.addPlayer')}</Text>
            <TextInput
              style={[styles.sheetInput, sheetNameError ? styles.inputError : null]}
              placeholder={t('players.fullName')}
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              value={sheetName}
              onChangeText={(v) => { setSheetName(v); setSheetNameError(''); }}
              autoFocus
              autoCapitalize="words"
            />
            {sheetNameError ? <Text style={styles.errorText}>{sheetNameError}</Text> : null}
            <TextInput
              style={styles.sheetInput}
              placeholder={t('players.ratingOptional')}
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              value={sheetRating}
              onChangeText={setSheetRating}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.sheetSubmit}
              onPress={handleAddOrUpdatePlayer}
            >
              <Text style={styles.sheetSubmitText}>
                {editingPlayer ? t('players.save') : t('players.addPlayer')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bulk Import modal */}
      <Modal visible={bulkModalVisible} transparent animationType="fade">
        <View style={styles.bulkOverlay}>
          <View style={styles.bulkModal}>
            <Text style={styles.bulkLabel}>{t('players.pasteNamesLabel')}</Text>
            <TextInput
              style={styles.bulkTextArea}
              placeholder="Name 1, Name 2, ..."
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.primary}
              value={bulkText}
              onChangeText={setBulkText}
              multiline
              numberOfLines={8}
            />
            <Text style={styles.bulkCount}>{t('players.importPlayersCount', { count: bulkCount })}</Text>
            <View style={styles.bulkButtons}>
              <TouchableOpacity style={styles.bulkCancel} onPress={() => { setBulkModalVisible(false); setBulkText(''); }}>
                <Text style={styles.bulkCancelText}>{t('home.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkImportBtn, bulkCount === 0 && styles.bulkImportDisabled]}
                onPress={handleBulkImport}
                disabled={bulkCount === 0 || bulkCount + players.length > MAX_PLAYERS}
              >
                <Text style={styles.bulkImportBtnText}>{t('players.importPlayersButton', { count: bulkCount })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[
          styles.startButton,
          players.length < 2 ? styles.startButtonDisabled : null,
        ]}
        onPress={handleStartTournament}
        disabled={players.length < 2 || starting}
        activeOpacity={0.9}
      >
        <Text style={[styles.startButtonText, players.length < 2 && styles.startButtonTextDisabled]}>
          {players.length < 2 ? t('players.startTournamentDisabled') : t('players.startTournament', { count: players.length })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 },
  bulkImportButton: { paddingVertical: 6, paddingHorizontal: 4 },
  bulkImportText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.textSecondary },
  badgeNormal: { backgroundColor: colors.textSecondary },
  badgeOrange: { backgroundColor: colors.orange },
  badgeRed: { backgroundColor: colors.danger },
  badgeText: { color: colors.card, fontSize: 13, fontWeight: '600' },
  subheader: { fontSize: 14, color: colors.textSecondary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  warningBanner: {
    backgroundColor: colors.warningBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: { fontSize: 14, color: colors.textPrimary },
  listContent: { padding: 16, paddingBottom: 120 },
  emptyList: { paddingVertical: 40, alignItems: 'center' },
  emptyListText: { fontSize: 16, color: colors.textSecondary },
  emptyListSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowNum: { width: 28, fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  rowName: { flex: 1, fontSize: 16, color: colors.textPrimary },
  rowRating: { width: 44, fontSize: 14, color: colors.textSecondary, textAlign: 'right' },
  rowIcon: { fontSize: 16, marginLeft: 8 },
  deleteRowButton: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    borderRadius: 10,
    marginBottom: 8,
  },
  deleteRowText: { fontSize: 18 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: colors.card, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetContainer: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  sheetClose: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  sheetCloseText: { fontSize: 22, color: colors.textSecondary },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  sheetInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border || '#e0e0e0',
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 8 },
  sheetSubmit: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetSubmitText: { color: colors.card, fontSize: 16, fontWeight: '600' },
  bulkOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  bulkModal: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  bulkLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  bulkTextArea: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  bulkCount: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  bulkButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  bulkCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  bulkCancelText: { color: colors.textSecondary, fontSize: 16 },
  bulkImportBtn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  bulkImportDisabled: { opacity: 0.6 },
  bulkImportBtnText: { color: colors.card, fontSize: 16, fontWeight: '600' },
  startButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonDisabled: { backgroundColor: colors.badgeFinished },
  startButtonText: { color: colors.card, fontSize: 17, fontWeight: '600' },
  startButtonTextDisabled: { color: colors.card, opacity: 0.9 },
});
}
