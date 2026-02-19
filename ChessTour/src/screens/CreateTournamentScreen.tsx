import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { v4 as uuid } from 'uuid';
import type { RootStackParamList } from '../navigation/types';
import type { Tournament } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getTournaments, setTournaments } from '../storage/tournaments';

const ROUNDS_OPTIONS = [3, 4, 5, 6, 7] as const;

type Nav = StackNavigationProp<RootStackParamList, 'CreateTournament'>;

export function CreateTournamentScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { colors, defaultRounds } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [rounds, setRounds] = useState(defaultRounds);
  const [timeControl, setTimeControl] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setRounds(defaultRounds);
  }, [defaultRounds]);

  const roundsTipKey = `create.roundsTip${rounds}` as const;

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('create.nameRequired'));
      return;
    }
    setNameError('');
    try {
      const list = await getTournaments();
      const now = new Date().toISOString();
      const tournament: Tournament = {
        id: uuid(),
        name: trimmed,
        date: date.toISOString(),
        rounds_total: rounds,
        rounds_completed: 0,
        time_control: timeControl.trim(),
        status: 'active',
        created_at: now,
      };
      await setTournaments([...list, tournament]);
      navigation.navigate('Players', { tournamentId: tournament.id });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  };

  const onDateChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const styles = makeStyles(colors);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('create.nameLabel')}</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          placeholder={t('create.namePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (nameError) setNameError('');
          }}
          autoCapitalize="words"
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text style={styles.label}>{t('create.rounds')}</Text>
        <View style={styles.pillRow}>
          {ROUNDS_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.pill, rounds === n && styles.pillActive]}
              onPress={() => setRounds(n)}
            >
              <Text style={[styles.pillText, rounds === n && styles.pillTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.tip}>{t(roundsTipKey)}</Text>

        <Text style={styles.label}>{t('create.timeControl')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('create.timeControlPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          value={timeControl}
          onChangeText={setTimeControl}
        />

        <Text style={styles.label}>{t('create.date')}</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            onTouchCancel={() => setShowDatePicker(false)}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity style={styles.datePickerDone} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.datePickerDoneText}>{t('common.done')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, { bottom: insets.bottom }]}
        onPress={handleCreate}
        activeOpacity={0.9}
      >
        <Text style={styles.submitText}>{t('create.createButton')}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border || '#e0e0e0',
    },
    inputError: { borderColor: colors.danger },
    errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
    pillRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    pill: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border || '#e0e0e0',
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    pillTextActive: { color: colors.card },
    tip: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
    dateButton: {
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border || '#e0e0e0',
    },
    dateText: { fontSize: 16, color: colors.textPrimary },
    datePickerDone: { marginTop: 8, alignSelf: 'flex-end' },
    datePickerDoneText: { color: colors.primary, fontSize: 16 },
    submitButton: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitText: { color: colors.card, fontSize: 17, fontWeight: '600' },
  });
}
