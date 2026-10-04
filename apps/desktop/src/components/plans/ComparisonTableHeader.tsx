import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TariffPlanDto, BillingInterval } from '@smartfeed/shared';
import { PlanActionButton } from '@/components/plans/PlanActionButton';

interface ComparisonTableHeaderProps {
  sortedPlans: TariffPlanDto[];
  currentPlanCode?: string | null;
  billingInterval: BillingInterval;
  isExpired: boolean;
  isLoadingPlanCode: string | null;
  isInvitedMember: boolean;
  isUk: boolean;
  isYearly: boolean;
  t: (key: string) => string;
  onSelect: (planCode: string, billingInterval?: BillingInterval) => void;
}

export function ComparisonTableHeader({
  sortedPlans,
  currentPlanCode,
  billingInterval,
  isExpired,
  isLoadingPlanCode,
  isInvitedMember,
  isUk,
  isYearly,
  t,
  onSelect,
}: ComparisonTableHeaderProps) {
  return (
    <tr className="border-b border-border bg-muted/40 divide-x divide-border/60">
      <th className="p-4 w-[28%] min-w-[220px] font-semibold text-foreground align-bottom">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">{t('plans.featuresTitle')}</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            {t('plans.comparisonSubtitle')}
          </span>
        </div>
      </th>

      {sortedPlans.map((plan) => {
        const name = isUk ? plan.nameUk : plan.nameEn;
        const currencySymbol = plan.currency === 'UAH' ? 'грн' : '$';
        const isPro = plan.code === 'PRO' || plan.isPopular;
        const isCurrent = currentPlanCode === plan.code;
        const isLoading = isLoadingPlanCode === plan.code;
        const hasYearlyOption = Boolean(plan.priceYearly && plan.priceYearly > 0);

        const displayMonthlyPrice =
          isYearly && hasYearlyOption ? Math.round(plan.priceYearly! / 12) : plan.priceMonthly;

        return (
          <th
            key={plan.id}
            data-testid={`comparison-header-${plan.code.toLowerCase()}`}
            className={cn(
              'p-4 min-w-[170px] text-center align-top transition-colors',
              isPro && 'bg-primary/[0.04] relative',
              isCurrent && !isExpired && 'bg-muted/30',
            )}
          >
            {isPro && (
              <div className="mb-2">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 inline-flex items-center gap-1 shadow-xs">
                  <Sparkles className="size-2.5" />
                  <span>{t('plans.popular')}</span>
                </Badge>
              </div>
            )}

            <div className="flex flex-col items-center gap-1">
              <span className="font-bold text-sm text-foreground">{name}</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {plan.code}
              </span>

              <div className="my-1 flex flex-col items-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    data-testid={`comparison-price-${plan.code.toLowerCase()}`}
                    className="text-xl font-extrabold text-foreground"
                  >
                    {displayMonthlyPrice === 0
                      ? isUk
                        ? '0 грн'
                        : 'Free'
                      : `${displayMonthlyPrice} ${currencySymbol}`}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{isUk ? '/міс' : '/mo'}</span>
                </div>

                {isYearly && hasYearlyOption ? (
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {plan.priceYearly} {currencySymbol} {isUk ? '/рік' : '/yr'}
                  </span>
                ) : null}
              </div>

              <PlanActionButton
                plan={plan}
                isCurrent={isCurrent}
                isExpired={isExpired}
                isLoading={isLoading}
                isPro={isPro}
                isInvitedMember={isInvitedMember}
                isUk={isUk}
                isYearly={isYearly}
                billingInterval={billingInterval}
                t={t}
                onSelect={onSelect}
              />
            </div>
          </th>
        );
      })}
    </tr>
  );
}
