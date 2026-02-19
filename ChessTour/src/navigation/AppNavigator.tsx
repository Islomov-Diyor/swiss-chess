import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateTournamentScreen } from '../screens/CreateTournamentScreen';
import { PlayersScreen } from '../screens/PlayersScreen';
import { TournamentOverviewScreen } from '../screens/TournamentOverviewScreen';
import { RoundScreen } from '../screens/RoundScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ShareScreen } from '../screens/ShareScreen';
import { AboutScreen } from '../screens/AboutScreen';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const mainMenuHeaderRight = (navigation: { navigate: (name: 'Home') => void }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Home')}
      style={styles.headerButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={[styles.headerButtonText, { color: colors.textPrimary }]}>{t('common.mainMenu')}</Text>
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: t('home.title'),
          headerTitleAlign: 'left',
          headerRight: () => (
            <View style={styles.headerRightRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('About')}
                style={styles.headerButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={[styles.headerButtonText, { color: colors.textPrimary }]}>{t('about.title')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={styles.gearButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.gearIcon}>⚙</Text>
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="CreateTournament"
        component={CreateTournamentScreen}
        options={({ navigation }) => ({ title: t('create.title'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
      <Stack.Screen
        name="Players"
        component={PlayersScreen}
        options={({ navigation }) => ({ title: t('players.title'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
      <Stack.Screen
        name="TournamentOverview"
        component={TournamentOverviewScreen}
        options={({ navigation }) => ({ title: t('overview.title'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
      <Stack.Screen
        name="Round"
        component={RoundScreen}
        options={({ navigation }) => ({ title: t('round.pairings'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
      <Stack.Screen
        name="Share"
        component={ShareScreen}
        options={({ navigation }) => ({ title: t('share.title'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({ title: t('settings.title'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={({ navigation }) => ({ title: t('about.title'), headerRight: () => mainMenuHeaderRight(navigation) })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRightRow: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { padding: 8, marginRight: 4 },
  headerButtonText: { fontSize: 15, fontWeight: '600' },
  gearButton: { padding: 8, marginRight: 8 },
  gearIcon: { fontSize: 22 },
});

