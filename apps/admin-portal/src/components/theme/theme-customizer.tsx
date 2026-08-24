'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Laptop, Check, ChevronDown, Sliders } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme, ACCENT_OPTIONS, ThemeMode } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function ThemeCustomizer() {
  const { themeMode, setThemeMode, accentColor, setAccentColor } = useTheme();
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = ACCENT_OPTIONS.find((opt) => opt.id === accentColor) || ACCENT_OPTIONS[0];

  const themeModes: {
    id: ThemeMode;
    labelUk: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dark', labelUk: 'Темна', labelEn: 'Dark', icon: Moon },
    { id: 'light', labelUk: 'Світла', labelEn: 'Light', icon: Sun },
    { id: 'system', labelUk: 'Системна', labelEn: 'System', icon: Laptop },
  ];

  return (
    <Card className="border-border bg-card shadow-sm overflow-visible relative z-30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            {isUk ? 'Оформлення та кольорова схема' : 'Appearance & Themes'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {isUk
            ? 'Налаштуйте режим підсвічування та офіційну палітру кольорів'
            : 'Configure dark/light mode and official shadcn color theme'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* 1. Theme Mode Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {isUk ? 'Режим відображення' : 'Display Mode'}
            </span>
            <span className="text-xs text-muted-foreground">
              {isUk
                ? 'Виберіть світлу, темну або системну тему консолі'
                : 'Select light, dark, or system appearance'}
            </span>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center p-1 rounded-lg bg-secondary/50 border border-border shrink-0">
            {themeModes.map((m) => {
              const Icon = m.icon;
              const isSelected = themeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`admin-theme-mode-${m.id}`}
                  onClick={() => setThemeMode(m.id)}
                  className={`flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{isUk ? m.labelUk : m.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[1px] w-full bg-border/60" />

        {/* 2. Color Palette Row (Shadcn Themes) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {isUk ? 'Кольорова палітра' : 'Theme Color Palette'}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 h-4 border-muted-foreground/30 text-muted-foreground"
              >
                shadcn/ui
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {isUk
                ? 'Zinc (монохром), Slate, Stone, Gray, Neutral або темна Bronze'
                : 'Zinc monochrome, slate, stone, gray, neutral, or dark bronze'}
            </span>
          </div>

          {/* Dropdown Selector */}
          <div className="relative min-w-[220px]" ref={dropdownRef}>
            <button
              type="button"
              data-testid="admin-accent-dropdown-trigger"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between h-9 px-3 rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground transition-all shadow-sm text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 rounded-full shrink-0 border border-white/20 shadow-sm"
                  style={{ backgroundColor: selectedOption.colorHex }}
                />
                <span>{selectedOption.name}</span>
              </div>

              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-foreground' : ''
                }`}
              />
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
              <div
                data-testid="admin-accent-dropdown-menu"
                className="absolute top-full right-0 mt-1.5 z-50 w-full min-w-[220px] p-1.5 rounded-lg border border-border bg-popover bg-zinc-950 dark:bg-zinc-950 text-popover-foreground shadow-2xl flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
              >
                {ACCENT_OPTIONS.map((opt) => {
                  const isSelected = accentColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`admin-accent-option-${opt.id}`}
                      onClick={() => {
                        setAccentColor(opt.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between h-8 px-2.5 rounded-md text-left transition-colors text-xs ${
                        isSelected
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: opt.colorHex }}
                        />
                        <span>{opt.name}</span>
                      </div>

                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
