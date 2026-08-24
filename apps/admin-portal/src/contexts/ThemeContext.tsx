'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber' | 'zinc';

export interface AccentOption {
  id: AccentColor;
  name: string;
  colorHex: string;
  badgeClass: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'violet', name: 'Фіолетовий (Default)', colorHex: '#8b5cf6', badgeClass: 'bg-violet-500' },
  { id: 'blue', name: 'Синій (Blue)', colorHex: '#3b82f6', badgeClass: 'bg-blue-500' },
  {
    id: 'emerald',
    name: 'Смарагдовий (Emerald)',
    colorHex: '#10b981',
    badgeClass: 'bg-emerald-500',
  },
  { id: 'rose', name: 'Рожевий (Rose)', colorHex: '#f43f5e', badgeClass: 'bg-rose-500' },
  { id: 'amber', name: 'Бурштиновий (Amber)', colorHex: '#f59e0b', badgeClass: 'bg-amber-500' },
  { id: 'zinc', name: 'Монохромний (Zinc)', colorHex: '#71717a', badgeClass: 'bg-zinc-400' },
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
  const [accentColor, setAccentColorState] = useState<AccentColor>('violet');
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
      'violet') as AccentColor;

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
