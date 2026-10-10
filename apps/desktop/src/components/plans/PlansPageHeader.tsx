import { RefreshCw, LayoutGrid, TableProperties, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { BillingInterval } from '@smartfeed/shared';

interface PlansPageHeaderProps {
  viewMode: 'cards' | 'comparison';
  setViewMode: (mode: 'cards' | 'comparison') => void;
  billingInterval: BillingInterval;
  setBillingInterval: (interval: BillingInterval) => void;
  isLoading: boolean;
  isInvitedMember: boolean;
  onRefresh: () => void;
}

export function PlansPageHeader({
  viewMode,
  setViewMode,
  billingInterval,
  setBillingInterval,
  isLoading,
  isInvitedMember,
  onRefresh,
}: PlansPageHeaderProps) {
  const { t } = useTranslation(['plans', 'common']);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
      {/* View Switcher & Refresh */}
      <div className="flex items-center gap-2">
        <div
          data-testid="plans-view-switcher"
          className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border/60 shadow-xs"
        >
          <Button
            type="button"
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            data-testid="plans-view-cards-btn"
            onClick={() => setViewMode('cards')}
            className={`h-8 px-3 text-xs gap-1.5 transition-all ${
              viewMode === 'cards'
                ? 'bg-background shadow-xs font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden md:inline">{t('plans.cardsView')}</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'comparison' ? 'secondary' : 'ghost'}
            size="sm"
            data-testid="plans-view-comparison-btn"
            onClick={() => setViewMode('comparison')}
            className={`h-8 px-3 text-xs gap-1.5 transition-all ${
              viewMode === 'comparison'
                ? 'bg-background shadow-xs font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TableProperties className="size-3.5" />
            <span className="hidden md:inline">{t('plans.comparisonView')}</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 px-2.5 text-xs shadow-xs"
          data-testid="refresh-plans-btn"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Billing Cycle Switcher */}
      {!isInvitedMember && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {t('plans.billingIntervalLabel')}
            </span>
            <div
              data-testid="billing-cycle-switcher"
              className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80"
            >
              <button
                type="button"
                data-testid="billing-cycle-monthly-btn"
                onClick={() => setBillingInterval('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('plans.billingMonthly')}
              </button>
              <button
                type="button"
                data-testid="billing-cycle-yearly-btn"
                onClick={() => setBillingInterval('yearly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  billingInterval === 'yearly'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{t('plans.billingYearly')}</span>
                <Badge
                  data-testid="save-20-badge"
                  className="bg-secondary text-secondary-foreground border-border text-[10px] px-1.5 py-0 font-bold"
                >
                  {t('plans.save20Badge')}
                </Badge>
              </button>
            </div>
          </div>

          {billingInterval === 'yearly' && (
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Sparkles className="size-3.5 shrink-0" />
              <span>{t('plans.saveYearlyDiscount')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
