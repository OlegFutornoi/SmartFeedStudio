import React from 'react';
import { AlertTriangle, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { UserQuotasDto } from '@smartfeed/shared';
import { useNavigate } from 'react-router-dom';

interface QuotaExcessBannerProps {
  quotas: UserQuotasDto | null;
  onOpenReconciliation: () => void;
}

export const QuotaExcessBanner: React.FC<QuotaExcessBannerProps> = ({
  quotas,
  onOpenReconciliation,
}) => {
  const { language } = useTranslation(['suppliers', 'plans', 'common']);
  const isUk = language === 'uk';
  const navigate = useNavigate();

  if (!quotas) return null;

  const isSuppliersExceeded =
    quotas.suppliers &&
    !quotas.suppliers.isUnlimited &&
    quotas.suppliers.used > quotas.suppliers.max;
  const isProductsExceeded =
    quotas.products && !quotas.products.isUnlimited && quotas.products.used > quotas.products.max;
  const isFeedsExceeded =
    quotas.feeds && !quotas.feeds.isUnlimited && quotas.feeds.used > quotas.feeds.max;

  if (!isSuppliersExceeded && !isProductsExceeded && !isFeedsExceeded) {
    return null;
  }

  const excessItems: string[] = [];
  if (isProductsExceeded && quotas.products) {
    const diff = quotas.products.used - quotas.products.max;
    excessItems.push(
      isUk
        ? `Товарів: ${quotas.products.used.toLocaleString()} / ${quotas.products.max.toLocaleString()} SKU (+${diff.toLocaleString()})`
        : `Products: ${quotas.products.used.toLocaleString()} / ${quotas.products.max.toLocaleString()} SKU (+${diff.toLocaleString()})`,
    );
  }
  if (isFeedsExceeded && quotas.feeds) {
    const diff = quotas.feeds.used - quotas.feeds.max;
    excessItems.push(
      isUk
        ? `Фідів: ${quotas.feeds.used} / ${quotas.feeds.max} (+${diff})`
        : `Feeds: ${quotas.feeds.used} / ${quotas.feeds.max} (+${diff})`,
    );
  }
  if (isSuppliersExceeded && quotas.suppliers) {
    const diff = quotas.suppliers.used - quotas.suppliers.max;
    excessItems.push(
      isUk
        ? `Постачальників: ${quotas.suppliers.used} / ${quotas.suppliers.max} (+${diff})`
        : `Suppliers: ${quotas.suppliers.used} / ${quotas.suppliers.max} (+${diff})`,
    );
  }

  return (
    <div
      data-testid="quota-excess-banner"
      className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 shadow-sm transition-all animate-in fade-in-50"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {isUk
                  ? `Перевищено ліміти тарифного плану «${quotas.planNameUk || 'Старт'}»`
                  : `Plan Limits Exceeded for «${quotas.planNameEn || 'Starter'}»`}
              </h4>
              <Badge variant="destructive" className="text-[10px] uppercase font-mono px-2 py-0.5">
                {isUk ? 'Потрібна дія' : 'Action required'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isUk
                ? `Після переходу на тариф у вас є надлишок даних: ${excessItems.join(', ')}. Видаліть зайві дані або поверніться на вищий тариф.`
                : `After plan switch you have excess data: ${excessItems.join(', ')}. Clean up excess data or upgrade your plan.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            variant="default"
            className="gap-2 text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
            onClick={onOpenReconciliation}
            data-testid="open-reconciliation-btn"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isUk ? 'Очистити надлишок' : 'Clean up excess'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-9 border-primary/30 hover:bg-primary/5 text-primary"
            onClick={() => navigate('/plans')}
            data-testid="upgrade-from-excess-btn"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isUk ? 'Підвищити тариф' : 'Upgrade plan'}</span>
            <ArrowRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
