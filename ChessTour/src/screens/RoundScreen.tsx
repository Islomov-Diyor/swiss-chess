import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackScreenProps, RootStackParamList } from '../navigation/types';
import type { RoundTabParamList } from '../navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RoundProvider, useRound } from '../context/RoundContext';
import { useTheme } from '../context/ThemeContext';
import { PairingsTab } from './round/PairingsTab';
import { StandingsTab } from './round/StandingsTab';

const Tab = createBottomTabNavigator<RoundTabParamList>();

function RoundTabs({ initialTab }: { initialTab?: 'Pairings' | 'Standings' }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      initialRouteName={initialTab === 'Standings' ? 'Standings' : 'Pairings'}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Pairings"
        component={PairingsTab}
        options={{ title: t('round.pairings') }}
      />
      <Tab.Screen
        name="Standings"
        component={StandingsTab}
        options={{ title: t('round.standings') }}
      />
    </Tab.Navigator>
  );
}

type Nav = StackNavigationProp<RootStackParamList, 'Round'>;

export function RoundScreen({ route }: RootStackScreenProps<'Round'>) {
  const navigation = useNavigation<Nav>();
  const { tournamentId, roundNumber: paramRound, readOnly, initialTab } = route.params;
  const roundNumber = paramRound ?? 1;

  return (
    <RoundProvider tournamentId={tournamentId} roundNumber={roundNumber} readOnly={readOnly}>
      <RoundScreenInner
        tournamentId={tournamentId}
        roundNumber={roundNumber}
        initialTab={initialTab}
        navigation={navigation}
      />
    </RoundProvider>
  );
}

function RoundScreenInner({
  tournamentId,
  roundNumber,
  initialTab,
  navigation,
}: {
  tournamentId: string;
  roundNumber: number;
  initialTab?: 'Pairings' | 'Standings';
  navigation: Nav;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { tournament, refresh } = useRound();

  const goToOverview = useCallback(() => {
    navigation.navigate('TournamentOverview', { tournamentId });
  }, [navigation, tournamentId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const onBack = () => {
        Alert.alert(t('round.leaveConfirm'), undefined, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.yes'), onPress: goToOverview },
        ]);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [t, goToOverview])
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <Text style={[styles.headerTitleMain, { color: colors.textPrimary }]}>
            {t('round.title', { current: roundNumber, total: tournament?.rounds_total ?? 0 })}
          </Text>
          {tournament ? (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {tournament.name}
            </Text>
          ) : null}
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity style={styles.headerLeft} onPress={goToOverview}>
          <Text style={[styles.headerBackText, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, tournament, roundNumber, t, tournamentId, colors, goToOverview]);

  return <RoundTabs initialTab={initialTab} />;
}

const styles = StyleSheet.create({
  headerTitle: { alignItems: 'flex-start' },
  headerTitleMain: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerLeft: { marginLeft: 8 },
  headerBackText: { fontSize: 28, fontWeight: '300' },
});
