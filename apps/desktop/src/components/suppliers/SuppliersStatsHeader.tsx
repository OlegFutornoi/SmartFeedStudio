import React from 'react';
import { Building2, Radio, ShoppingBag } from 'lucide-react';
import { QuotaMetricCard } from '@/components/ui/QuotaMetricCard';
import { useTranslation } from '@/i18n';
import { UserQuotasDto } from '@smartfeed/shared';

interface SuppliersStatsHeaderProps {
  quotas: UserQuotasDto | null;
  suppliersCount: number;
}

export const SuppliersStatsHeader: React.FC<SuppliersStatsHeaderProps> = ({
  quotas,
  suppliersCount,
}) => {
  const { t, language } = useTranslation(['suppliers', 'common']);
  const isUk = language === 'uk';

  // Override suppliers used count with current live length if available
  const suppliersQuota = quotas?.suppliers
    ? {
        ...quotas.suppliers,
        used: suppliersCount,
        percentUsed: quotas.suppliers.max > 0 ? (suppliersCount / quotas.suppliers.max) * 100 : 0,
        isExceeded: quotas.suppliers.max > 0 && suppliersCount > quotas.suppliers.max,
      }
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          {t('title', { defaultValue: 'Постачальники та Джерела Даних' })}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle', {
            defaultValue:
              'Керуйте постачальниками, підключайте XML/CSV фіди та налаштовуйте імпорт',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuotaMetricCard
          title={isUk ? 'Постачальники' : 'Suppliers'}
          quota={suppliersQuota}
          icon={Building2}
          testId="suppliers-quota-card"
        />
        <QuotaMetricCard
          title={isUk ? 'Джерела фідів' : 'Feed Sources'}
          quota={quotas?.feeds}
          icon={Radio}
          testId="feeds-quota-card"
        />
        <QuotaMetricCard
          title={isUk ? 'Товари в каталозі' : 'Catalog Products'}
          quota={quotas?.products}
          icon={ShoppingBag}
          unit="SKU"
          testId="products-quota-card"
        />
      </div>
    </div>
  );
};
