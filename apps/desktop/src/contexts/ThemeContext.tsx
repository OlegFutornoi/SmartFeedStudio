import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = 'zinc' | 'slate' | 'stone' | 'gray' | 'neutral' | 'bronze';

export interface AccentOption {
  id: AccentColor;
  labelUk: string;
  labelEn: string;
  colorHex: string;
  isDefault?: boolean;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'zinc',
    labelUk: 'Zinc (Монохромна)',
    labelEn: 'Zinc (Monochrome)',
    colorHex: '#ffffff',
    isDefault: true,
  },
  {
    id: 'slate',
    labelUk: 'Slate (Сланцева)',
    labelEn: 'Slate (Cool Gray)',
    colorHex: '#94a3b8',
  },
  {
    id: 'stone',
    labelUk: 'Stone (Теплий камінь)',
    labelEn: 'Stone (Warm Gray)',
    colorHex: '#d6d3d1',
  },
  {
    id: 'gray',
    labelUk: 'Gray (Графітова)',
    labelEn: 'Gray (Graphite)',
    colorHex: '#9ca3af',
  },
  {
    id: 'neutral',
    labelUk: 'Neutral (Нейтральна)',
    labelEn: 'Neutral',
    colorHex: '#a3a3a3',
  },
  {
    id: 'bronze',
    labelUk: 'Bronze (Темна бронза)',
    labelEn: 'Bronze (Metallic)',
    colorHex: '#d97706',
  },
];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultAccent?: AccentColor;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  defaultAccent = 'zinc',
  storageKey = 'smartfeed_theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('smartfeed_theme_accent') as AccentColor) || defaultAccent;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
      return;
    }

    root.classList.add(theme);
    setResolvedTheme(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey],
  );

  const setAccentColor = useCallback((newAccent: AccentColor) => {
    localStorage.setItem('smartfeed_theme_accent', newAccent);
    setAccentColorState(newAccent);
  }, []);

  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      accentColor,
      setAccentColor,
    }),
    [theme, setTheme, resolvedTheme, accentColor, setAccentColor],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
