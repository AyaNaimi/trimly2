// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors, Fonts, Radius, Spacing, Metrics, Shadow } from '../theme';

const THEME_STORAGE_KEY = '@trimly_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  // null = follow system, 'light' = forced light, 'dark' = forced dark
  const [userPreference, setUserPreference] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(val => {
        if (val === 'light' || val === 'dark') {
          setUserPreference(val);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const isDark = userPreference
    ? userPreference === 'dark'
    : systemScheme === 'dark';

  const Colors = isDark ? DarkColors : LightColors;

  const toggleTheme = useCallback(async () => {
    const next = isDark ? 'light' : 'dark';
    setUserPreference(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, [isDark]);

  const setTheme = useCallback(async (mode) => {
    // mode: 'light' | 'dark' | 'system'
    if (mode === 'system') {
      setUserPreference(null);
      await AsyncStorage.removeItem(THEME_STORAGE_KEY).catch(() => {});
    } else {
      setUserPreference(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
    }
  }, []);

  const value = {
    isDark,
    Colors,
    Fonts,
    Radius,
    Spacing,
    Metrics,
    Shadow,
    toggleTheme,
    setTheme,
    userPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
