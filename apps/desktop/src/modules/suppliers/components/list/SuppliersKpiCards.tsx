import React from 'react';
import { Truck, Rss, Package, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/i18n';
import type { UserQuotasDto } from '@smartfeed/shared';

interface SuppliersKpiCardsProps {
  suppliersCount: number;
  activeFeedsCount: number;
  totalProductsCount: number;
  activeRulesCount: number;
  quotas?: UserQuotasDto | null;
}

export const SuppliersKpiCards: React.FC<SuppliersKpiCardsProps> = ({
  suppliersCount,
  activeFeedsCount,
  totalProductsCount,
  activeRulesCount,
  quotas,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const maxSuppliers = quotas?.suppliers?.max ?? 10;
  const usedSuppliers = quotas?.suppliers?.used ?? suppliersCount;
  const quotaPercent = Math.min(100, Math.round((usedSuppliers / Math.max(1, maxSuppliers)) * 100));

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      data-testid="suppliers-kpi-cards"
    >
      {/* 1. Total Suppliers */}
      <Card className="border-border/80 bg-card shadow-xs" data-testid="suppliers-quota-card">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('suppliers:kpiTotalSuppliers', { defaultValue: 'Всі постачальники' })}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {suppliersCount}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Truck className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{t('suppliers:kpiQuotaUsage', { defaultValue: 'Ліміт тарифу' })}</span>
              <span>
                {usedSuppliers} / {maxSuppliers}
              </span>
            </div>
            <Progress value={quotaPercent} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Feeds */}
      <Card className="border-border/80 bg-card shadow-xs" data-testid="feeds-quota-card">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('suppliers:kpiActiveFeeds', { defaultValue: 'Активні джерела фідів' })}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {activeFeedsCount}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Rss className="size-4.5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {t('suppliers:kpiFeedsDesc', { defaultValue: 'URL та завантажені локальні файли' })}
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Imported SKUs */}
      <Card className="border-border/80 bg-card shadow-xs" data-testid="products-quota-card">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('suppliers:kpiTotalProducts', { defaultValue: 'Імпортовані товари' })}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {totalProductsCount.toLocaleString()}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Package className="size-4.5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {t('suppliers:kpiProductsDesc', {
              defaultValue: 'Товари з прив’язкою до постачальників',
            })}
          </p>
        </CardContent>
      </Card>

      {/* 4. Active Pricing Rules */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('suppliers:kpiActiveRules', { defaultValue: 'Правила цін та валют' })}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {activeRulesCount}
              </h3>
            </div>
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <SlidersHorizontal className="size-4.5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {t('suppliers:kpiRulesDesc', { defaultValue: 'Категорійні націнки та курси НБУ' })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
