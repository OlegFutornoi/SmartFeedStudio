'use client';

import React from 'react';
import { Compass, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavigationHeaderProps {
  onAddItem: () => void;
}

export const NavigationHeader = React.memo(function NavigationHeader({
  onAddItem,
}: NavigationHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <Compass className="size-6 text-primary shrink-0" />
          <span>{t('navigation', 'title')}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('navigation', 'subtitle')}</p>
      </div>

      <Button
        onClick={onAddItem}
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 shrink-0"
      >
        <Plus className="h-4 w-4" />
        {t('navigation', 'add_item')}
      </Button>
    </div>
  );
});
