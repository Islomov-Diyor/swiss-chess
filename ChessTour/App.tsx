import React, { useEffect, useState, Component, type ErrorInfo } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Text, type ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';
import { getStoredLanguage, initI18n } from './src/i18n';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (Platform.OS === 'web') console.error('App error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff', minHeight: '100vh' as ViewStyle['minHeight'] },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, color: '#666' },
});

function AppContent() {
  const { colors, theme } = useTheme();
  return (
    <>
      <AppNavigator />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  const [i18nInstance, setI18nInstance] = useState<i18n | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lng = await getStoredLanguage();
        if (cancelled) return;
        const i18n = await initI18n(lng);
        if (cancelled) return;
        setI18nInstance(i18n);
      } catch (e) {
        setInitError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (initError) {
    return (
      <ErrorBoundary>
        <View style={[styles.loading, { backgroundColor: '#fff', minHeight: '100vh' as ViewStyle['minHeight'] }]}>
          <Text style={{ fontSize: 16, color: '#c00' }}>Init error: {initError}</Text>
        </View>
      </ErrorBoundary>
    );
  }

  if (!i18nInstance) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <LoadingScreen />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const rootStyle: ViewStyle = { flex: 1, ...(Platform.OS === 'web' ? { minHeight: '100vh' as ViewStyle['minHeight'] } : {}) };
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={rootStyle}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18nInstance}>
          <ThemeProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </ThemeProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as ViewStyle['minHeight'] } : {}),
  },
});