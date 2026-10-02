import { Zap, AlertTriangle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TariffPlanDto, BillingInterval } from '@smartfeed/shared';

interface PlanActionButtonProps {
  plan: TariffPlanDto;
  isCurrent: boolean;
  isExpired: boolean;
  isLoading: boolean;
  isPro: boolean;
  isInvitedMember: boolean;
  isUk: boolean;
  isYearly: boolean;
  billingInterval: BillingInterval;
  t: (key: string) => string;
  onSelect: (planCode: string, billingInterval?: BillingInterval) => void;
}

export function PlanActionButton({
  plan,
  isCurrent,
  isExpired,
  isLoading,
  isPro,
  isInvitedMember,
  isUk,
  isYearly,
  billingInterval,
  t,
  onSelect,
}: PlanActionButtonProps) {
  return (
    <div className="w-full max-w-[140px] mt-1">
      {isInvitedMember ? (
        <Button
          variant="outline"
          disabled
          className="h-7 px-2 text-[11px] w-full cursor-not-allowed opacity-70"
        >
          {isUk ? 'Керується власником' : 'Managed by Owner'}
        </Button>
      ) : isCurrent && !isExpired ? (
        <Button
          variant="outline"
          disabled
          data-testid={`comparison-select-btn-${plan.code.toLowerCase()}`}
          className="h-7 px-2 text-[11px] w-full border-border text-foreground bg-muted font-semibold cursor-default"
        >
          <Check className="size-3 mr-1" />
          <span>{t('plans.currentPlan')}</span>
        </Button>
      ) : isCurrent && isExpired ? (
        <Button
          variant="default"
          data-testid={`comparison-select-btn-${plan.code.toLowerCase()}`}
          onClick={() => onSelect(plan.code, billingInterval)}
          disabled={isLoading}
          className="h-7 px-2 text-[11px] w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1"
        >
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <AlertTriangle className="size-3" />
          )}
          <span>{t('plans.renewPlan')}</span>
        </Button>
      ) : (
        <Button
          variant={isPro ? 'default' : 'outline'}
          data-testid={`comparison-select-btn-${plan.code.toLowerCase()}`}
          onClick={() => onSelect(plan.code, billingInterval)}
          disabled={isLoading}
          className={cn(
            'h-7 px-2 text-[11px] w-full font-semibold gap-1',
            isPro && 'bg-primary text-primary-foreground shadow-xs',
          )}
        >
          {isLoading ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
          <span>
            {plan.priceMonthly === 0
              ? t('plans.selectPlan')
              : isYearly
                ? t('plans.selectYearlyPlan')
                : t('plans.selectMonthlyPlan')}
          </span>
        </Button>
      )}
    </div>
  );
}
