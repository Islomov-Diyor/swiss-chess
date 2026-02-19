import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#c0392b';
const CARD_BG = '#ffffff';
const BG = '#f9f9f9';
const GREY = '#666666';
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

export function AboutScreen() {
  const { t } = useTranslation();

  let appVersion = '1.0.0';
  try {
    const appConfig = require('../../app.json');
    appVersion = appConfig?.expo?.version ?? appVersion;
  } catch {}

  const openMail = () => Linking.openURL('mailto:diyorbekshaxrisabz@gmail.com');
  const openTelegram = () => Linking.openURL('https://t.me/diyorproger2');
  const openInstagram = () => Linking.openURL('https://instagram.com/d._islomov');
  const openWebsite = () => Linking.openURL('https://shvetsarchashaxmat.pythonanywhere.com');
  const openPrivacy = () => Linking.openURL('https://chesstour.app/privacy');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top section: logo, name, version, tagline */}
      <View style={[styles.card, styles.topCard]}>
        <Text style={styles.pawn}>♟</Text>
        <Text style={styles.appName}>{t('appName')}</Text>
        <Text style={styles.version}>{t('about.version', { version: appVersion })}</Text>
        <Text style={styles.tagline}>{t('about.tagline')}</Text>
      </View>

      <View style={styles.divider} />

      {/* Developer section */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('about.developer')}</Text>
        <Row leftIcon="person-outline" left={t('about.developerName')} right={t('about.developerValue')} />
        <Row leftIcon="briefcase-outline" left={t('about.titleLabel')} right={t('about.titleValue')} />
        <Row leftIcon="location-outline" left={t('about.location')} right={t('about.locationValue')} />
        <Row
          leftIcon="mail-outline"
          left={t('about.contact')}
          right={t('about.contactValue')}
          rightAccent
          onPress={openMail}
        />
        <Row
          leftIcon="paper-plane-outline"
          left={t('about.telegram')}
          right={t('about.telegramValue')}
          rightAccent
          onPress={openTelegram}
        />
        <Row
          leftIcon="logo-instagram"
          left={t('about.instagram')}
          right={t('about.instagramValue')}
          rightAccent
          onPress={openInstagram}
        />
        <Row
          leftIcon="globe-outline"
          left={t('about.website')}
          right={t('about.websiteValue')}
          rightAccent
          onPress={openWebsite}
        />
      </View>

      <View style={styles.divider} />

      {/* App info section */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('about.appInfo')}</Text>
        <Row left={t('about.pairingSystem')} right={t('about.pairingSystemValue')} />
        <Row left={t('about.maxPlayers')} right={t('about.maxPlayersValue')} />
        <Row left={t('about.languages')} right={t('about.languagesValue')} />
        <Row left={t('about.dataStorage')} right={t('about.dataStorageValue')} />
        <Row left={t('about.versionLabel')} right={appVersion} />
      </View>

      <View style={styles.divider} />

      {/* Legal section */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('about.legal')}</Text>
        <TouchableOpacity style={styles.rowTouchable} onPress={openPrivacy} activeOpacity={0.6}>
          <Text style={styles.rowLeftText}>{t('about.privacyPolicy')}</Text>
          <Ionicons name="chevron-forward" size={20} color={GREY} />
        </TouchableOpacity>
        <View style={[styles.row, styles.rowNoTouch]}>
          <View style={styles.flex1}>
            <Text style={styles.rowLeftText}>{t('about.copyright')}</Text>
            <Text style={styles.rowSubtext}>{t('about.allRightsReserved')}</Text>
          </View>
        </View>
      </View>

      {/* Bottom tag */}
      <Text style={styles.madeWith}>{t('about.madeWith')}</Text>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function Row({
  leftIcon,
  left,
  right,
  rightAccent,
  onPress,
}: {
  leftIcon?: string;
  left: string;
  right: string;
  rightAccent?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowLeft}>
        {leftIcon ? <Ionicons name={leftIcon as keyof typeof Ionicons.glyphMap} size={20} color={GREY} style={styles.rowIcon} /> : null}
        <Text style={styles.rowLeftText}>{left}</Text>
      </View>
      <Text style={[styles.rowRightText, rightAccent && styles.rowRightAccent]} numberOfLines={1}>
        {right}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

const ROW_MIN_HEIGHT = 48;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    ...CARD_SHADOW,
  },
  topCard: { alignItems: 'center', paddingVertical: 24 },
  pawn: { fontSize: 64, color: ACCENT, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  version: { fontSize: 14, color: GREY, marginBottom: 4 },
  tagline: { fontSize: 14, color: GREY, fontStyle: 'italic' },
  divider: { height: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: 8,
  },
  rowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: 8,
  },
  rowNoTouch: { alignItems: 'flex-start' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { marginRight: 10 },
  rowLeftText: { fontSize: 15, color: '#333' },
  rowRightText: { fontSize: 15, color: GREY, marginLeft: 12, flex: 1, textAlign: 'right' },
  rowRightAccent: { color: ACCENT, fontWeight: '600' },
  rowSubtext: { fontSize: 12, color: GREY, marginTop: 2 },
  flex1: { flex: 1 },
  madeWith: { fontSize: 13, color: GREY, textAlign: 'center', marginTop: 24 },
  bottomSpacer: { height: 40 },
});
