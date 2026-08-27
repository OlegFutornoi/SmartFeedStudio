'use client';

import React from 'react';
import { TargetApp, NavigationItemDto } from '@smartfeed/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { NavigationItemRow } from './NavigationItemRow';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface NavigationItemListProps {
  items: NavigationItemDto[];
  filterApp: TargetApp;
  onFilterChange: (app: TargetApp) => void;
  onMoveUp: (index: number, filteredList: NavigationItemDto[]) => void;
  onMoveDown: (index: number, filteredList: NavigationItemDto[]) => void;
  onToggleActive: (item: NavigationItemDto) => void;
  onEdit: (item: NavigationItemDto) => void;
  onDelete: (item: NavigationItemDto) => void;
}

export const NavigationItemList = React.memo(function NavigationItemList({
  items,
  filterApp,
  onFilterChange,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onEdit,
  onDelete,
}: NavigationItemListProps) {
  const { t } = useLanguage();

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => item.targetApp === filterApp);
  }, [items, filterApp]);

  return (
    <Card
      data-testid="navigation-items-card"
      className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm"
    >
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              {t('navigation', 'items_in_database')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('navigation', 'items_in_database_desc')}
            </CardDescription>
          </div>

          {/* Target App Filter Tabs */}
          <div
            data-testid="navigation-app-filter-tabs"
            className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40 shrink-0"
          >
            {([TargetApp.DESKTOP, TargetApp.ADMIN_PORTAL] as const).map((app) => (
              <button
                key={app}
                data-testid={`navigation-filter-${app.toLowerCase()}`}
                onClick={() => onFilterChange(app)}
                className={cn(
                  'px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer',
                  filterApp === app
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {app === TargetApp.DESKTOP
                  ? `${t('navigation', 'filter_desktop')} (${items.filter((i) => i.targetApp === TargetApp.DESKTOP).length})`
                  : `${t('navigation', 'filter_admin')} (${items.filter((i) => i.targetApp === TargetApp.ADMIN_PORTAL).length})`}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-0">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <p className="text-sm">Пункти меню відсутні або не знайдено</p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <NavigationItemRow
              key={item.id || item.key}
              item={item}
              index={index}
              totalCount={filteredItems.length}
              onMoveUp={() => onMoveUp(index, filteredItems)}
              onMoveDown={() => onMoveDown(index, filteredItems)}
              onToggleActive={onToggleActive}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
});
