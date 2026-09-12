import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Laptop, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTheme, ACCENT_OPTIONS, RADIUS_OPTIONS, type Theme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n';

export function ThemeSelector() {
  const { theme, setTheme, accentColor, setAccentColor, radius, setRadius } = useTheme();
  const { t, language, setLanguage } = useTranslation(['settings', 'common']);
  const isUk = language === 'uk';

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    id: Theme;
    labelUk: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dark', labelUk: 'Темна', labelEn: 'Dark', icon: Moon },
    { id: 'light', labelUk: 'Світла', labelEn: 'Light', icon: Sun },
    { id: 'system', labelUk: 'Системна', labelEn: 'System', icon: Laptop },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Theme Mode Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {isUk ? 'Режим відображення' : 'Display Mode'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isUk
              ? 'Виберіть світлу, темну або системну тему інтерфейсу'
              : 'Select light, dark, or system appearance'}
          </span>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center p-1 rounded-lg bg-secondary/50 border border-border shrink-0">
          {themeModes.map((m) => {
            const Icon = m.icon;
            const isSelected = theme === m.id;
            return (
              <button
                key={m.id}
                type="button"
                data-testid={`theme-mode-${m.id}`}
                onClick={() => setTheme(m.id)}
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
              {isUk ? 'Кольорова схема бренду' : 'Theme Color Palette'}
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
              ? 'Монохромна, сланцева, кам’яна, графітова, бронзова або смарагдова палітра'
              : 'Zinc, slate, stone, gray, neutral, bronze, or emerald green theme'}
          </span>
        </div>

        {/* Dropdown Selector */}
        <div className="relative min-w-[220px]" ref={dropdownRef}>
          <button
            type="button"
            data-testid="accent-color-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between h-9 px-3 rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground transition-all shadow-sm text-xs font-medium"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full shrink-0 border border-white/20 shadow-sm"
                style={{ backgroundColor: selectedOption.colorHex }}
              />
              <span>{isUk ? selectedOption.labelUk : selectedOption.labelEn}</span>
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
              data-testid="accent-color-dropdown-menu"
              className="absolute top-full right-0 mt-1.5 z-50 w-full min-w-[220px] p-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
            >
              {ACCENT_OPTIONS.map((opt) => {
                const isSelected = accentColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`accent-option-${opt.id}`}
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
                      <span>{isUk ? opt.labelUk : opt.labelEn}</span>
                    </div>

                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="h-[1px] w-full bg-border/60" />

      {/* 3. Border Radius Row (Unified Global Geometry) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{t('borderRadius')}</span>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 h-4 border-muted-foreground/30 text-muted-foreground"
            >
              {t('globalBadge')}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{t('borderRadiusDesc')}</span>
        </div>

        {/* Radius Segmented Control */}
        <div
          data-testid="border-radius-segmented-control"
          className="flex items-center p-1 rounded-lg bg-secondary/50 border border-border shrink-0"
        >
          {RADIUS_OPTIONS.map((r) => {
            const isSelected = radius === r.id;
            return (
              <button
                key={r.id}
                type="button"
                data-testid={`radius-option-${r.id}`}
                onClick={() => setRadius(r.id)}
                title={isUk ? r.descriptionUk : r.descriptionEn}
                className={`flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-background text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{r.pixels}</span>
                <span className="text-[10px] opacity-70 hidden md:inline">
                  {isUk
                    ? r.labelUk.split(' ')[1]?.replace(/[()]/g, '')
                    : r.labelEn.split(' ')[1]?.replace(/[()]/g, '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[1px] w-full bg-border/60" />

      {/* 4. Interface Language Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {isUk ? 'Мова інтерфейсу' : 'Interface Language'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isUk
              ? 'Оберіть основну мову для роботи в додатку'
              : 'Choose interface localization for client app'}
          </span>
        </div>

        {/* Language Segmented Control */}
        <div className="flex items-center p-1 rounded-lg bg-secondary/50 border border-border shrink-0">
          <button
            type="button"
            onClick={() => setLanguage('uk')}
            className={`flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium transition-all ${
              isUk
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Українська (UA)</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium transition-all ${
              !isUk
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>English (EN)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
