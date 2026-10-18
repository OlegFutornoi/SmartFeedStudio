import React from 'react';
import { Search, CheckCircle2, XCircle, Rss, Sparkles, Store, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_MARKETPLACES } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

export type CategoryMappingFilter = 'ALL' | 'MAPPED' | 'UNMAPPED';

interface SupplierCategoriesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedFeedId: string;
  onSelectFeedId: (value: string) => void;
  availableFeeds: Array<{ id: string; name: string }>;
  selectedMarketplace: string;
  onSelectMarketplace: (value: string) => void;
  mappingFilter: CategoryMappingFilter;
  onMappingFilterChange: (value: CategoryMappingFilter) => void;
  activeCount: number;
  mappedCount: number;
  totalCount: number;
  onBatchToggle: (active: boolean) => void;
  onAutoMap: () => void;
}

export const SupplierCategoriesToolbar: React.FC<SupplierCategoriesToolbarProps> = ({
  search,
  onSearchChange,
  selectedFeedId,
  onSelectFeedId,
  availableFeeds,
  selectedMarketplace,
  onSelectMarketplace,
  mappingFilter,
  onMappingFilterChange,
  activeCount,
  mappedCount,
  totalCount,
  onBatchToggle,
  onAutoMap,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="space-y-2.5">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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

        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={onAutoMap}
            title={t('suppliers:btnAutoMapTooltip', {
              defaultValue:
                'Автоматично підібрати категорії та комісії маркетплейсу за ключовими словами',
            })}
            className="h-7 text-xs gap-1.5 px-2.5"
            data-testid="auto-map-categories-btn"
          >
            <Sparkles className="size-3.5 text-muted-foreground" />
            {t('suppliers:btnAutoMapCategories', { defaultValue: 'Авто-підбір' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onBatchToggle(true)}
            className="h-7 text-xs gap-1 px-2.5"
            data-testid="activate-all-categories-btn"
          >
            <CheckCircle2 className="size-3 text-success" />
            {t('suppliers:activateAll', { defaultValue: 'Увімкнути всі' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onBatchToggle(false)}
            className="h-7 text-xs gap-1 px-2.5"
            data-testid="deactivate-all-categories-btn"
          >
            <XCircle className="size-3 text-muted-foreground" />
            {t('suppliers:deactivateAll', { defaultValue: 'Вимкнути всі' })}
          </Button>
        </div>
      </div>

      {/* Inline Search, Marketplace Selector & KPI Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-muted/40 p-2 rounded-lg border border-border/70">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('suppliers:searchCategory', {
                defaultValue: 'Пошук за назвою категорії...',
              })}
              className="pl-8 h-8 text-xs bg-background/90"
              data-testid="search-category-input"
            />
          </div>

          {/* Target Marketplace Selector */}
          <div className="w-40 shrink-0">
            <Select value={selectedMarketplace} onValueChange={onSelectMarketplace}>
              <SelectTrigger
                className="h-8 text-xs bg-background/90"
                data-testid="category-marketplace-select"
                aria-label={t('suppliers:selectMarketplaceAria', {
                  defaultValue: 'Оберіть маркетплейс',
                })}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Store className="size-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MARKETPLACES.map((mp) => (
                  <SelectItem key={mp.code} value={mp.code}>
                    {mp.name} ({mp.xmlAttributeName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mapping Status Filter */}
          <div className="w-36 shrink-0">
            <Select
              value={mappingFilter}
              onValueChange={(v) => onMappingFilterChange(v as CategoryMappingFilter)}
            >
              <SelectTrigger
                className="h-8 text-xs bg-background/90"
                data-testid="category-mapping-filter"
                aria-label={t('suppliers:filterMappingAria', { defaultValue: 'Фільтр привʼязки' })}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="size-3 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t('suppliers:filterAllCategories', { defaultValue: 'Усі категорії' })}
                </SelectItem>
                <SelectItem value="MAPPED">
                  {t('suppliers:filterMappedOnly', { defaultValue: 'Привʼязані' })}
                </SelectItem>
                <SelectItem value="UNMAPPED">
                  {t('suppliers:filterUnmappedOnly', { defaultValue: 'Без привʼязки' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feed Filter Selector */}
          {availableFeeds.length > 0 && (
            <div className="w-40 shrink-0">
              <Select value={selectedFeedId} onValueChange={onSelectFeedId}>
                <SelectTrigger
                  className="h-8 text-xs bg-background/90"
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

        {/* Compact KPI Counters */}
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground tabular-nums">
          <Badge
            variant="outline"
            className="h-6 px-2 text-2xs font-medium bg-background/80 gap-1"
            data-testid="mapped-categories-stat"
          >
            <span>{t('suppliers:mappedCategoriesStat', { defaultValue: 'Привʼязано' })}:</span>
            <span className="font-semibold text-foreground">
              {mappedCount}/{totalCount}
            </span>
          </Badge>

          <Badge variant="outline" className="h-6 px-2 text-2xs font-medium bg-background/80 gap-1">
            <span>{t('suppliers:activeCategoriesStat', { defaultValue: 'Активно' })}:</span>
            <span className="font-semibold text-foreground">
              {activeCount}/{totalCount}
            </span>
          </Badge>
        </div>
      </div>
    </div>
  );
};
