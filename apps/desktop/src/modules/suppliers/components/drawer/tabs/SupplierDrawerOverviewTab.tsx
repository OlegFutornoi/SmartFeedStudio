import React from 'react';
import { Package, Rss, Sliders, DollarSign, Mail, Phone, User, Globe, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

interface SupplierDrawerOverviewTabProps {
  supplier: SupplierDto;
  onNavigateToTab?: (tab: string) => void;
}

export const SupplierDrawerOverviewTab: React.FC<SupplierDrawerOverviewTabProps> = ({
  supplier,
  onNavigateToTab,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="space-y-4 p-5" data-testid="supplier-drawer-overview-tab">
      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => onNavigateToTab?.('products')}
          className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors"
          data-testid="overview-kpi-products"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">
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
            <span className="text-[11px] font-medium">
              {t('suppliers:columnFeeds', { defaultValue: 'Джерела фідів' })}
            </span>
            <Rss className="size-3.5 text-blue-500" />
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
            <span className="text-[11px] font-medium">
              {t('suppliers:tabCategories', { defaultValue: 'Категорії' })}
            </span>
            <Sliders className="size-3.5 text-amber-500" />
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
            <span className="text-[11px] font-medium">
              {t('suppliers:filterCurrency', { defaultValue: 'Валюта' })}
            </span>
            <DollarSign className="size-3.5 text-emerald-500" />
          </div>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {supplier.baseCurrency || 'UAH'}
          </span>
        </div>
      </div>

      {/* Description / Notes */}
      {supplier.notes && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground">
              {t('common:description', { defaultValue: 'Опис постачальника' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
            {supplier.notes}
          </CardContent>
        </Card>
      )}

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Contact Information */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-primary" />
              {t('suppliers:columnContacts', { defaultValue: 'Контактна інформація' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3 text-muted-foreground" />
                {t('common:phone', { defaultValue: 'Телефон' })}
              </span>
              <span className="font-medium text-foreground">{supplier.contactPhone || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3 text-muted-foreground" />
                Email
              </span>
              <span className="font-medium text-foreground">{supplier.contactEmail || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3 text-muted-foreground" />
                {t('common:website', { defaultValue: 'Вебсайт' })}
              </span>
              <span className="font-medium text-foreground truncate max-w-[160px]">
                {supplier.website || '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Store Information */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Coins className="size-3.5 text-primary" />
              {t('suppliers:storeInfo', { defaultValue: 'Параметри валюти та націнки' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('suppliers:filterCurrency', { defaultValue: 'Базова валюта' })}
              </span>
              <span className="font-medium text-foreground">{supplier.baseCurrency || 'UAH'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('suppliers:filterCurrency', { defaultValue: 'Цільова валюта' })}
              </span>
              <span className="font-medium text-foreground">
                {supplier.targetCurrency || 'UAH'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('suppliers:columnCurrencyMarkup', { defaultValue: 'Базова націнка' })}
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{supplier.defaultMarginPercent || 0}%
                {supplier.defaultFixedMarkup ? ` +${supplier.defaultFixedMarkup} ₴` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t('suppliers:storeInfo', { defaultValue: 'Крок округлення' })}
              </span>
              <span className="font-medium text-foreground">
                {supplier.priceRounding || 'NONE'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
