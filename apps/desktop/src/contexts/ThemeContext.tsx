import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = 'zinc' | 'slate' | 'stone' | 'gray' | 'neutral' | 'bronze';
export type RadiusPreset = '0' | '0.25' | '0.5' | '0.75';

export interface AccentOption {
  id: AccentColor;
  labelUk: string;
  labelEn: string;
  colorHex: string;
  isDefault?: boolean;
}

export interface RadiusOption {
  id: RadiusPreset;
  labelUk: string;
  labelEn: string;
  valueRem: string;
  pixels: string;
  descriptionUk: string;
  descriptionEn: string;
  isDefault?: boolean;
}

export const RADIUS_OPTIONS: RadiusOption[] = [
  {
    id: '0',
    labelUk: '0px (Гострий)',
    labelEn: '0px (Sharp)',
    valueRem: '0rem',
    pixels: '0px',
    descriptionUk: 'Прямокутний, монолітний стиль',
    descriptionEn: 'Sharp, monolithic style',
  },
  {
    id: '0.25',
    labelUk: '4px (Компактний)',
    labelEn: '4px (Compact)',
    valueRem: '0.25rem',
    pixels: '4px',
    descriptionUk: 'Витончений мінімалізм',
    descriptionEn: 'Subtle minimalism',
  },
  {
    id: '0.5',
    labelUk: '8px (Гармонійний)',
    labelEn: '8px (Modern)',
    valueRem: '0.5rem',
    pixels: '8px',
    descriptionUk: 'Сучасний стандарт shadcn/ui',
    descriptionEn: 'Modern shadcn/ui standard',
    isDefault: true,
  },
  {
    id: '0.75',
    labelUk: "12px (М'який)",
    labelEn: '12px (Soft)',
    valueRem: '0.75rem',
    pixels: '12px',
    descriptionUk: 'Плавні, заокруглені контури',
    descriptionEn: 'Smooth, rounded contours',
  },
];

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
  defaultRadius?: RadiusPreset;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
  radius: RadiusPreset;
  setRadius: (radius: RadiusPreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  defaultAccent = 'zinc',
  defaultRadius = '0.5',
  storageKey = 'smartfeed_theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('smartfeed_theme_accent') as AccentColor) || defaultAccent;
  });

  const [radius, setRadiusState] = useState<RadiusPreset>(() => {
    return (localStorage.getItem('smartfeed_theme_radius') as RadiusPreset) || defaultRadius;
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

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-radius', radius);
    root.style.setProperty('--radius', `${radius}rem`);
  }, [radius]);

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

  const setRadius = useCallback((newRadius: RadiusPreset) => {
    localStorage.setItem('smartfeed_theme_radius', newRadius);
    setRadiusState(newRadius);
  }, []);

  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      accentColor,
      setAccentColor,
      radius,
      setRadius,
    }),
    [theme, setTheme, resolvedTheme, accentColor, setAccentColor, radius, setRadius],
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
