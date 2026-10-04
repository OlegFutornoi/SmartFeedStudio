'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <Button
      data-testid="language-toggle-btn"
      variant="outline"
      size="sm"
      onClick={() => setLocale(locale === 'uk' ? 'en' : 'uk')}
      className="h-9 px-2.5 gap-1.5 font-medium text-xs rounded-lg border-border/80 hover:bg-muted transition-colors"
      title={locale === 'uk' ? 'Перемкнути на English' : 'Switch to Ukrainian'}
      aria-label="Switch Language"
    >
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-semibold uppercase">{locale}</span>
    </Button>
  );
}
