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
  const { t } = useTranslation(['suppliers', 'common']);

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuotaMetricCard
          title={t('suppliers:suppliersTitle', { defaultValue: 'Постачальники' })}
          quota={suppliersQuota}
          icon={Building2}
          testId="suppliers-quota-card"
        />
        <QuotaMetricCard
          title={t('suppliers:feedSourcesTitle', { defaultValue: 'Джерела фідів' })}
          quota={quotas?.feeds}
          icon={Radio}
          testId="feeds-quota-card"
        />
        <QuotaMetricCard
          title={t('suppliers:catalogProductsTitle', { defaultValue: 'Товари в каталозі' })}
          quota={quotas?.products}
          icon={ShoppingBag}
          unit="SKU"
          testId="products-quota-card"
        />
      </div>
    </div>
  );
};
