import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { setStoredLanguage } from '../i18n';
import type { LanguageCode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { getStoredTheme } from '../storage/settings';
import type { ThemeMode } from '../storage/settings';
import type { ThemeColors } from '../theme/palette';

const ROUNDS_OPTIONS = [3, 4, 5, 6, 7] as const;

type Nav = StackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { colors, theme: themeMode, setTheme, defaultRounds, setDefaultRounds, showRatings, setShowRatings } = useTheme();
  const [language, setLanguage] = useState<LanguageCode>('uz');

  useEffect(() => {
    const lng = (i18n?.language as LanguageCode) || 'uz';
    setLanguage(lng === 'en' || lng === 'ru' || lng === 'uz' ? lng : 'uz');
  }, [i18n]);

  const handleLanguage = async (code: LanguageCode) => {
    setLanguage(code);
    await setStoredLanguage(code);
    if (i18n) i18n.changeLanguage(code);
  };

  const handleTheme = async (mode: ThemeMode) => {
    await setTheme(mode);
  };

  const handleDefaultRounds = async (n: number) => {
    await setDefaultRounds(n);
  };

  const handleShowRatings = async (value: boolean) => {
    await setShowRatings(value);
  };

  let appVersion = '1.0.0';
  try {
    const appConfig = require('../../app.json');
    appVersion = appConfig?.expo?.version ?? appVersion;
  } catch {}

  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <View style={styles.segmented}>
            {(['uz', 'ru', 'en'] as const).map((code) => (
              <TouchableOpacity
                key={code}
                style={[styles.segButton, language === code && styles.segButtonActive]}
                onPress={() => handleLanguage(code)}
              >
                <Text style={[styles.segButtonText, language === code && styles.segButtonTextActive]}>
                  {code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.theme')}</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segButton, themeMode === 'light' && styles.segButtonActive]}
              onPress={() => handleTheme('light')}
            >
              <Text style={[styles.segButtonText, themeMode === 'light' && styles.segButtonTextActive]}>
                {t('settings.light')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segButton, themeMode === 'dark' && styles.segButtonActive]}
              onPress={() => handleTheme('dark')}
            >
              <Text style={[styles.segButtonText, themeMode === 'dark' && styles.segButtonTextActive]}>
                {t('settings.dark')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.defaults')}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.defaultRounds')}</Text>
          <View style={styles.pillRow}>
            {ROUNDS_OPTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.pill, defaultRounds === n && styles.pillActive]}
                onPress={() => handleDefaultRounds(n)}
              >
                <Text style={[styles.pillText, defaultRounds === n && styles.pillTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.row, styles.rowSwitch]}>
          <Text style={styles.label}>{t('settings.showRatings')}</Text>
          <Switch
            value={showRatings}
            onValueChange={handleShowRatings}
            trackColor={{ false: colors.badgeFinished, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <TouchableOpacity
          style={styles.aboutNavRow}
          onPress={() => navigation.navigate('About')}
          activeOpacity={0.6}
        >
          <Text style={styles.aboutLabel}>{t('about.title')}</Text>
          <Text style={styles.aboutArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>{t('settings.version')}</Text>
          <Text style={styles.aboutValue}>{appVersion}</Text>
        </View>
        <Text style={styles.aboutText}>{t('settings.pairingSystem')}</Text>
        <Text style={styles.aboutText}>{t('settings.localData')}</Text>
        <Text style={styles.aboutText}>{t('settings.offline')}</Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    section: { marginBottom: 28 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    row: { marginBottom: 16 },
    rowSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 16, color: colors.textPrimary, marginBottom: 8 },
    segmented: { flexDirection: 'row', gap: 8 },
    segButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    segButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    segButtonText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    segButtonTextActive: { color: colors.card },
    pillRow: { flexDirection: 'row', gap: 8 },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    pillTextActive: { color: colors.card },
    aboutNavRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 16,
    },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    aboutLabel: { fontSize: 15, color: colors.textPrimary },
    aboutValue: { fontSize: 15, color: colors.textSecondary },
    aboutArrow: { fontSize: 22, color: colors.textSecondary },
    aboutText: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  });
}
