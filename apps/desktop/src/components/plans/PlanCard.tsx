'use client';

import React from 'react';
import { Check, Sparkles, Zap, Loader2, AlertTriangle, Clock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import type { TariffPlanDto, BillingInterval } from '@smartfeed/shared';
import { PlanFeatureBulletList } from './PlanFeatureBulletList';

export type PlanItem = TariffPlanDto;

interface PlanCardProps {
  plan: TariffPlanDto;
  currentPlanCode?: string | null;
  billingInterval?: BillingInterval;
  isExpired?: boolean;
  daysRemaining?: number | null;
  isLoading?: boolean;
  isInvitedMember?: boolean;
  onSelect: (planCode: string, billingInterval?: BillingInterval) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanCode,
  billingInterval = 'monthly',
  isExpired = false,
  daysRemaining,
  isLoading = false,
  isInvitedMember = false,
  onSelect,
}) => {
  const { t, language } = useTranslation(['plans', 'common']);
  const isUk = language === 'uk';
  const isCurrent = currentPlanCode === plan.code;
  const name = isUk ? plan.nameUk : plan.nameEn;
  const description = isUk ? plan.descriptionUk : plan.descriptionEn;
  const codeKey = plan.code.toLowerCase();
  const currencySymbol = plan.currency === 'UAH' ? 'грн' : '$';

  // Dynamic pricing calculation based on billing interval
  const isYearly = billingInterval === 'yearly';
  const hasYearlyOption = Boolean(plan.priceYearly && plan.priceYearly > 0);

  const displayMonthlyPrice =
    isYearly && hasYearlyOption ? Math.round(plan.priceYearly! / 12) : plan.priceMonthly;

  const yearlySavingAmount = hasYearlyOption ? plan.priceMonthly * 12 - plan.priceYearly! : 0;

  return (
    <Card
      data-testid={`plan-card-${codeKey}`}
      className={cn(
        'relative flex flex-col justify-between border-border bg-card transition-all duration-200',
        plan.isPopular && 'border-primary shadow-md ring-1 ring-primary/40',
        isCurrent && !isExpired && 'border-emerald-500/60 bg-emerald-500/[0.02]',
        isCurrent && isExpired && 'border-amber-500/60 bg-amber-500/[0.02]',
      )}
    >
      {/* Top Badges */}
      <div className="absolute -top-2.5 right-4 flex items-center gap-1.5">
        {plan.isPopular && (
          <Badge
            data-testid={`plan-popular-badge-${codeKey}`}
            className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="size-2.5" />
            <span>{t('plans.popular')}</span>
          </Badge>
        )}
        {isCurrent && !isExpired && (
          <Badge
            data-testid={`plan-current-badge-${codeKey}`}
            className="bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-0.5 flex items-center gap-1 shadow-sm"
          >
            <Zap className="size-2.5" />
            <span>{t('plans.currentPlan')}</span>
          </Badge>
        )}
        {isCurrent && isExpired && (
          <Badge
            data-testid={`plan-expired-badge-${codeKey}`}
            className="bg-amber-600 text-white text-[10px] font-semibold px-2.5 py-0.5 flex items-center gap-1 shadow-sm"
          >
            <AlertTriangle className="size-2.5" />
            <span>{t('plans.expiredBadge')}</span>
          </Badge>
        )}
      </div>

      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle data-testid={`plan-title-${codeKey}`} className="text-base font-semibold">
              {name}
            </CardTitle>
            <Badge
              variant="outline"
              data-testid={`plan-code-badge-${codeKey}`}
              className="text-[10px] font-mono uppercase"
            >
              {plan.code}
            </Badge>
          </div>
          {description && (
            <CardDescription
              data-testid={`plan-desc-${codeKey}`}
              className="text-xs mt-1 min-h-[32px]"
            >
              {description}
            </CardDescription>
          )}

          {/* Price Header with Dynamic Intervals */}
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-baseline gap-1.5">
              <span
                data-testid={`plan-price-monthly-${codeKey}`}
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                {displayMonthlyPrice} {currencySymbol}
              </span>
              <span className="text-xs text-muted-foreground">{isUk ? '/міс' : '/mo'}</span>
            </div>

            {/* Trial badge for STARTER */}
            {plan.code === 'STARTER' && (
              <div className="mt-0.5">
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {isUk ? '7 днів тріалу при реєстрації' : '7-day trial on signup'}
                </span>
              </div>
            )}

            {/* Dynamic Billing Subtitle & Badges */}
            {isYearly && hasYearlyOption ? (
              <div className="flex flex-col gap-1 mt-1 text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span data-testid={`plan-price-yearly-${codeKey}`}>
                    {t('plans.billedYearly', {
                      amount: (plan.priceYearly || 0).toLocaleString(),
                    })}
                  </span>
                </div>
                {yearlySavingAmount > 0 && (
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded self-start">
                    {t('plans.yearlySavingNote', {
                      amount: yearlySavingAmount.toLocaleString(),
                    })}
                  </span>
                )}
              </div>
            ) : !isYearly && hasYearlyOption ? (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                <span data-testid={`plan-price-yearly-${codeKey}`}>
                  {plan.priceYearly} {currencySymbol} {isUk ? '/рік' : '/yr'}
                </span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {t('plans.save20Badge')}
                </span>
              </div>
            ) : null}

            {/* Remaining days if active */}
            {isCurrent && !isExpired && daysRemaining !== null && daysRemaining !== undefined && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Clock className="size-3.5" />
                <span>{t('plans.daysRemaining', { count: daysRemaining })}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <PlanFeatureBulletList plan={plan} isUk={isUk} />
        </CardContent>
      </div>

      {/* Action Footer */}
      <CardFooter className="pt-4 border-t border-border/60">
        {isInvitedMember ? (
          <Button
            variant="outline"
            disabled
            className="w-full h-8 text-xs cursor-not-allowed opacity-70"
          >
            {isUk ? 'Керується власником' : 'Managed by Owner'}
          </Button>
        ) : isCurrent && !isExpired ? (
          <Button
            variant="outline"
            disabled
            data-testid={`plan-select-btn-${codeKey}`}
            className="w-full h-8 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold cursor-default"
          >
            <Check className="size-3.5 mr-1.5" />
            <span>
              {daysRemaining && daysRemaining <= 7 && plan.code === 'STARTER'
                ? isUk
                  ? 'Активний пробний період'
                  : 'Active Trial Period'
                : t('plans.currentPlan')}
            </span>
          </Button>
        ) : isCurrent && isExpired ? (
          <Button
            variant="default"
            data-testid={`plan-select-btn-${codeKey}`}
            onClick={() => onSelect(plan.code, billingInterval)}
            disabled={isLoading}
            className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="size-3.5" />
            )}
            <span>{t('plans.renewPlan')}</span>
          </Button>
        ) : (
          <Button
            variant={plan.isPopular ? 'default' : 'outline'}
            data-testid={`plan-select-btn-${codeKey}`}
            onClick={() => onSelect(plan.code, billingInterval)}
            disabled={isLoading}
            className={cn(
              'w-full h-8 text-xs font-semibold gap-1.5',
              plan.isPopular && 'bg-primary text-primary-foreground shadow-xs',
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Zap className="size-3.5" />
            )}
            <span>{isYearly ? t('plans.selectYearlyPlan') : t('plans.selectMonthlyPlan')}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
