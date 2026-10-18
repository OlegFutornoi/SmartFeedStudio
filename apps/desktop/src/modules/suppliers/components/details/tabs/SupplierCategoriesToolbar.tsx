import React from 'react';
import { Search, CheckCircle2, XCircle, Rss } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/i18n';

interface SupplierCategoriesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedFeedId: string;
  onSelectFeedId: (value: string) => void;
  availableFeeds: Array<{ id: string; name: string }>;
  activeCount: number;
  totalCount: number;
  onBatchToggle: (active: boolean) => void;
}

export const SupplierCategoriesToolbar: React.FC<SupplierCategoriesToolbarProps> = ({
  search,
  onSearchChange,
  selectedFeedId,
  onSelectFeedId,
  availableFeeds,
  activeCount,
  totalCount,
  onBatchToggle,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="space-y-3">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('suppliers:tabCategoriesTitle', { defaultValue: 'Категорійний аналіз та статуси' })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('suppliers:tabCategoriesDesc', {
              defaultValue:
                'Керуйте активністю категорій постачальника (активні додаються в каталог, неактивні виключаються)',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBatchToggle(true)}
            className="h-8 text-xs gap-1"
            data-testid="activate-all-categories-btn"
          >
            <CheckCircle2 className="size-3 text-success" />
            {t('suppliers:activateAll', { defaultValue: 'Увімкнути всі' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onBatchToggle(false)}
            className="h-8 text-xs gap-1"
            data-testid="deactivate-all-categories-btn"
          >
            <XCircle className="size-3 text-muted-foreground" />
            {t('suppliers:deactivateAll', { defaultValue: 'Вимкнути всі' })}
          </Button>
        </div>
      </div>

      {/* Search & Feed Filter Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/70">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('suppliers:searchCategory', {
                defaultValue: 'Пошук за назвою категорії...',
              })}
              className="pl-8 h-8 text-xs bg-background/80"
              data-testid="search-category-input"
            />
          </div>

          {/* Feed Filter Selector */}
          {availableFeeds.length > 0 && (
            <div className="w-44 shrink-0">
              <Select value={selectedFeedId} onValueChange={onSelectFeedId}>
                <SelectTrigger
                  className="h-8 text-xs bg-background/80"
                  data-testid="category-feed-filter"
                  aria-label={t('suppliers:filterByFeed', { defaultValue: 'Фільтр за фідом' })}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Rss className="size-3 text-muted-foreground shrink-0" />
                    <SelectValue
                      placeholder={t('suppliers:allFeeds', { defaultValue: 'Всі фіди' })}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t('suppliers:allFeeds', { defaultValue: 'Всі фіди' })}
                  </SelectItem>
                  {availableFeeds.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id}>
                      {feed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground shrink-0">
          {t('suppliers:activeCategoriesStat', { defaultValue: 'Активно' })}:{' '}
          <span className="font-semibold text-foreground">
            {activeCount} / {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
};
