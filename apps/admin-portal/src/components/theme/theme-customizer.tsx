'use client';

import React, { useState } from 'react';
import { Moon, Sun, Laptop, Palette, Check, Sparkles, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTheme, ACCENT_OPTIONS, ThemeMode, AccentColor } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export function ThemeCustomizer() {
  const { themeMode, setThemeMode, accentColor, setAccentColor } = useTheme();
  const { user } = useAuth();
  const [showSavedAlert, setShowSavedAlert] = useState(false);

  const handleModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    triggerSavedFeedback();
  };

  const handleAccentChange = (accent: AccentColor) => {
    setAccentColor(accent);
    triggerSavedFeedback();
  };

  const triggerSavedFeedback = () => {
    setShowSavedAlert(true);
    setTimeout(() => {
      setShowSavedAlert(false);
    }, 2000);
  };

  const themeModes: {
    id: ThemeMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dark', label: 'Темна (Dark)', icon: Moon },
    { id: 'light', label: 'Світла (Light)', icon: Sun },
    { id: 'system', label: 'Системна (System)', icon: Laptop },
  ];

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Зовнішній вигляд та кольорова схема</CardTitle>
              <CardDescription>
                Персоналізація інтерфейсу для вашого облікового запису
              </CardDescription>
            </div>
          </div>

          {showSavedAlert && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs animate-in fade-in"
            >
              <Check className="h-3 w-3 mr-1" />
              Збережено локально
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Device & User Storage Info Notice */}
        <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">
              Індивідуальні налаштування пристрою:
            </span>
            <p className="mt-0.5">
              Обрана кольорова тема зберігається локально на цьому пристрої окремо для користувача{' '}
              <span className="font-mono text-primary font-semibold">{user?.email || 'admin'}</span>
              .
            </p>
          </div>
        </div>

        {/* Theme Mode Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">Режим відображення</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeModes.map((m) => {
              const Icon = m.icon;
              const isSelected = themeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id)}
                  className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border transition-all text-xs font-semibold ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
                      : 'border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Palette Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">Колір акцентів платформи</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACCENT_OPTIONS.map((opt) => {
              const isSelected = accentColor === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAccentChange(opt.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all text-xs font-medium ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/40'
                      : 'border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full shrink-0 shadow-sm flex items-center justify-center text-white"
                    style={{ backgroundColor: opt.colorHex }}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className="truncate">{opt.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Theme Preview */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Попередній перегляд стилів (Live Preview)
          </label>
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/30"
                >
                  Акцентний бейдж
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Вторинний бейдж
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">SmartFeed Studio UI</span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm shadow-primary/25">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Основна кнопка</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-border">
                <span>Контурна кнопка</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
