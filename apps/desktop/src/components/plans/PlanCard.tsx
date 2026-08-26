import React from 'react';
import { Check, Sparkles, Zap, Shield, Rocket, Loader2, Clock, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export interface PlanItem {
  id: string;
  code: string;
  nameUk: string;
  nameEn: string;
  descriptionUk?: string | null;
  descriptionEn?: string | null;
  priceMonthly: number;
  currency: string;
  maxXmlLimit: number;
  aiCredits: number;
  canCloudBackup: boolean;
  isPopular: boolean;
  durationDays?: number | null;
  featuresUk?: string[];
  featuresEn?: string[];
}

interface PlanCardProps {
  plan: PlanItem;
  currentPlanCode?: string | null;
  isExpired?: boolean;
  daysRemaining?: number | null;
  isLoading?: boolean;
  onSelect: (planCode: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanCode,
  isExpired = false,
  daysRemaining,
  isLoading = false,
  onSelect,
}) => {
  const { t, language } = useTranslation(['plans', 'common']);
  const isCurrent = currentPlanCode === plan.code;
  const planName = language === 'uk' ? plan.nameUk : plan.nameEn;
  const planDesc = language === 'uk' ? plan.descriptionUk || '' : plan.descriptionEn || '';
  const features = language === 'uk' ? plan.featuresUk || [] : plan.featuresEn || [];

  return (
    <Card
      data-testid={`plan-card-${plan.code.toLowerCase()}`}
      className={cn(
        'relative flex flex-col transition-all duration-300 hover:shadow-lg',
        plan.isPopular && 'border-primary shadow-md shadow-primary/10 ring-1 ring-primary/30',
        isCurrent && !isExpired && 'border-emerald-500/60 bg-emerald-500/[0.02]',
        isCurrent && isExpired && 'border-amber-500/60 bg-amber-500/[0.02]',
      )}
    >
      {/* Top Badges */}
      <div className="absolute -top-3 right-4 flex items-center gap-1.5">
        {plan.isPopular && (
          <Badge className="bg-primary text-primary-foreground text-xs gap-1 font-semibold shadow-sm">
            <Sparkles className="h-3 w-3" />
            {t('plans.popular')}
          </Badge>
        )}
        {isCurrent && !isExpired && (
          <Badge className="bg-emerald-500 text-white text-xs gap-1 font-semibold shadow-sm">
            <Zap className="h-3 w-3" />
            {t('plans.currentPlan')}
          </Badge>
        )}
        {isCurrent && isExpired && (
          <Badge className="bg-amber-500 text-white text-xs gap-1 font-semibold shadow-sm">
            <AlertTriangle className="h-3 w-3" />
            {t('plans.expiredBadge')}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {(plan.code === 'STARTER' || plan.code === 'FREE') && (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
            {plan.code === 'GROWTH' && <Rocket className="h-5 w-5 text-sky-500" />}
            {plan.code === 'PRO' && <Zap className="h-5 w-5 text-primary" />}
            {plan.code === 'ENTERPRISE' && <Sparkles className="h-5 w-5 text-purple-500" />}
            <span>{planName}</span>
          </CardTitle>
        </div>
        <CardDescription className="text-xs min-h-[32px] text-muted-foreground mt-1">
          {planDesc}
        </CardDescription>

        {/* Price & Duration */}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold tracking-tight">
            {plan.priceMonthly === 0 ? '$0' : `$${plan.priceMonthly}`}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {plan.priceMonthly === 0
              ? plan.durationDays
                ? ` / ${t('plans.durationFormat', { count: plan.durationDays })}`
                : ''
              : t('plans.perMonth')}
          </span>
        </div>

        {/* Duration badge or remaining status */}
        {plan.durationDays && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {isCurrent && !isExpired && daysRemaining !== null && daysRemaining !== undefined ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('plans.daysRemaining', { count: daysRemaining })}
              </span>
            ) : (
              <span>
                {plan.code === 'STARTER' || plan.code === 'FREE'
                  ? t('plans.trialBadge', { count: plan.durationDays })
                  : t('plans.durationFormat', { count: plan.durationDays })}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="border-t pt-4">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
            {t('plans.featuresTitle')}
          </div>
          <ul className="space-y-2 text-xs">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          onClick={() => onSelect(plan.code)}
          disabled={isLoading}
          data-testid={`select-plan-${plan.code.toLowerCase()}`}
          variant={isCurrent && !isExpired ? 'outline' : plan.isPopular ? 'default' : 'secondary'}
          className={cn(
            'w-full font-semibold gap-2',
            plan.isPopular && !isCurrent && 'shadow-md shadow-primary/20',
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('common.loading')}</span>
            </>
          ) : isCurrent && !isExpired ? (
            <span>{t('plans.active')}</span>
          ) : isCurrent && isExpired ? (
            <span>{t('plans.renewPlan')}</span>
          ) : (
            <span>{t('plans.selectPlan')}</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
