// @golden - Reference pattern for KPI metric cards with semantic tokens, tabular-nums, and official icons (UI-02, UI-07)
import React from 'react';
import { Package, Rss, Sliders, DollarSign } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

interface SupplierDrawerKpiMetricsProps {
  supplier: SupplierDto;
  onNavigateToTab?: (tab: string) => void;
}

export const SupplierDrawerKpiMetrics: React.FC<SupplierDrawerKpiMetricsProps> = ({
  supplier,
  onNavigateToTab,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div
        onClick={() => onNavigateToTab?.('feeds')}
        className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors"
        data-testid="overview-kpi-products"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1">
          <span className="text-xs font-medium">
            {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
          </span>
          <Package className="size-3.5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {supplier.productsCount || 0}
        </span>
      </div>

      <div
        onClick={() => onNavigateToTab?.('feeds')}
        className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors"
        data-testid="overview-kpi-feeds"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1">
          <span className="text-xs font-medium">
            {t('suppliers:columnFeeds', { defaultValue: 'Джерела фідів' })}
          </span>
          <Rss className="size-3.5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {supplier.activeFeedsCount || 0}
        </span>
      </div>

      <div
        onClick={() => onNavigateToTab?.('categories')}
        className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors"
        data-testid="overview-kpi-categories"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1">
          <span className="text-xs font-medium">
            {t('suppliers:tabCategories', { defaultValue: 'Категорії' })}
          </span>
          <Sliders className="size-3.5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {supplier.categoriesCount || supplier.activeCategoriesCount || 0}
        </span>
      </div>

      <div
        onClick={() => onNavigateToTab?.('currencies')}
        className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors"
        data-testid="overview-kpi-currencies"
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1">
          <span className="text-xs font-medium">
            {t('suppliers:filterCurrency', { defaultValue: 'Валюта' })}
          </span>
          <DollarSign className="size-3.5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {supplier.baseCurrency || 'UAH'}
        </span>
      </div>
    </div>
  );
};
