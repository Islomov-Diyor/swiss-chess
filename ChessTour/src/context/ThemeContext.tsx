import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ThemeColors } from '../theme/palette';
import { lightColors, darkColors } from '../theme/palette';
import type { ThemeMode } from '../storage/settings';
import { getStoredTheme, setStoredTheme, getStoredShowRatings, setStoredShowRatings, getStoredDefaultRounds, setStoredDefaultRounds } from '../storage/settings';

type ThemeContextValue = {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => Promise<void>;
  showRatings: boolean;
  setShowRatings: (on: boolean) => Promise<void>;
  defaultRounds: number;
  setDefaultRounds: (n: number) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [showRatings, setShowRatingsState] = useState(true);
  const [defaultRounds, setDefaultRoundsState] = useState(5);

  useEffect(() => {
    getStoredTheme().then(setThemeState);
    getStoredShowRatings().then(setShowRatingsState);
    getStoredDefaultRounds().then(setDefaultRoundsState);
  }, []);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    await setStoredTheme(mode);
    setThemeState(mode);
  }, []);

  const setShowRatings = useCallback(async (on: boolean) => {
    await setStoredShowRatings(on);
    setShowRatingsState(on);
  }, []);

  const setDefaultRounds = useCallback(async (n: number) => {
    await setStoredDefaultRounds(n);
    setDefaultRoundsState(n);
  }, []);

  const colors: ThemeColors = theme === 'dark' ? darkColors : lightColors;

  const value: ThemeContextValue = {
    theme,
    colors,
    setTheme,
    showRatings,
    setShowRatings,
    defaultRounds,
    setDefaultRounds,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
