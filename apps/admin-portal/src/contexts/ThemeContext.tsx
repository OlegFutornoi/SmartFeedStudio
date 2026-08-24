'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'zinc' | 'slate' | 'stone' | 'gray' | 'neutral' | 'bronze';

export interface AccentOption {
  id: AccentColor;
  name: string;
  colorHex: string;
  isDefault?: boolean;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'zinc',
    name: 'Zinc (Default)',
    colorHex: '#ffffff',
    isDefault: true,
  },
  {
    id: 'slate',
    name: 'Slate',
    colorHex: '#94a3b8',
  },
  {
    id: 'stone',
    name: 'Stone',
    colorHex: '#d6d3d1',
  },
  {
    id: 'gray',
    name: 'Gray',
    colorHex: '#9ca3af',
  },
  {
    id: 'neutral',
    name: 'Neutral',
    colorHex: '#a3a3a3',
  },
  {
    id: 'bronze',
    name: 'Bronze',
    colorHex: '#d97706',
  },
];

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedMode: 'dark' | 'light';
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const getStorageKey = useCallback(
    (key: string) => {
      return `smartfeed_${key}_${userId}`;
    },
    [userId],
  );

  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('zinc');
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>('dark');

  // Load theme settings when user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userModeKey = `smartfeed_theme_mode_${userId}`;
    const userAccentKey = `smartfeed_theme_accent_${userId}`;

    const savedMode = (localStorage.getItem(userModeKey) ||
      localStorage.getItem('smartfeed_theme_mode') ||
      'dark') as ThemeMode;

    const savedAccent = (localStorage.getItem(userAccentKey) ||
      localStorage.getItem('smartfeed_theme_accent') ||
      'zinc') as AccentColor;

    setThemeModeState(savedMode);
    setAccentColorState(savedAccent);
  }, [userId]);

  // Apply theme mode to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    let currentResolved: 'dark' | 'light' = 'dark';

    if (themeMode === 'system') {
      currentResolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      currentResolved = themeMode;
    }

    root.classList.add(currentResolved);
    setResolvedMode(currentResolved);
  }, [themeMode]);

  // Apply accent color to document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('theme_mode'), mode);
      localStorage.setItem('smartfeed_theme_mode', mode);
    }
  };

  const setAccentColor = (accent: AccentColor) => {
    setAccentColorState(accent);
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('theme_accent'), accent);
      localStorage.setItem('smartfeed_theme_accent', accent);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        resolvedMode,
        accentColor,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
