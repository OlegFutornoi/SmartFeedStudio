'use client';

import React from 'react';
import { Compass, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          {t('navigation', 'title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('navigation', 'subtitle')}</p>
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
