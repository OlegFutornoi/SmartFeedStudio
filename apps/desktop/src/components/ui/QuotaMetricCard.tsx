import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { QuotaItemDto } from '@smartfeed/shared';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';

interface QuotaMetricCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  quota?: QuotaItemDto | null;
  unit?: string;
  testId?: string;
}

export function QuotaMetricCard({ title, icon: Icon, quota, unit, testId }: QuotaMetricCardProps) {
  const { t } = useTranslation(['common', 'suppliers']);

  if (!quota) {
    return (
      <Card data-testid={testId} className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">...</div>
        </CardContent>
      </Card>
    );
  }

  const isUnlimited = quota.isUnlimited;
  const isCritical = quota.percentUsed >= 100 || quota.isExceeded;
  const isWarning = quota.percentUsed >= 80 && !isCritical;
  const displayPercent = Math.round(quota.percentUsed);

  let progressColor = 'bg-primary';
  let badgeColor = 'text-muted-foreground';

  if (isCritical) {
    progressColor = 'bg-destructive';
    badgeColor = 'text-destructive font-semibold';
  } else if (isWarning) {
    progressColor = 'bg-primary/80';
    badgeColor = 'text-foreground font-semibold';
  } else if (!isUnlimited) {
    progressColor = 'bg-primary';
  }

  return (
    <Card
      data-testid={testId}
      className={`border-border/80 bg-card/60 backdrop-blur-md transition-all duration-200 ${
        isCritical ? 'border-destructive/40 shadow-xs' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1.5">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`size-3.5 ${isCritical ? 'text-destructive' : 'text-primary'}`} />
      </CardHeader>

      <CardContent className="space-y-1.5 p-3.5 pt-0">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-xl font-bold tracking-tight tabular-nums text-foreground">
              {quota.used.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              / {isUnlimited ? '∞' : quota.max.toLocaleString()} {unit}
            </span>
          </div>

          {!isUnlimited && (
            <span className={`text-[11px] font-mono ${badgeColor}`}>{displayPercent}%</span>
          )}
        </div>

        {/* Animated Progress Bar */}
        {!isUnlimited && (
          <div className="w-full bg-secondary/50 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, displayPercent)}%` }}
            />
          </div>
        )}

        {/* Footer Subtext or Upgrade Prompt */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          {isUnlimited ? (
            <span className="text-foreground text-[11px] font-medium">
              {t('common:unlimitedPlan', { defaultValue: 'Безлімітний тариф' })}
            </span>
          ) : isCritical ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-destructive text-[11px] font-medium">
                {t('common:limitExceeded', { defaultValue: 'Ліміт вичерпано' })}
              </span>
              <Link
                to="/plans"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>{t('common:upgradeQuota', { defaultValue: 'Збільшити квоту' })}</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          ) : isWarning ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-foreground text-[11px]">
                {t('common:remaining', { defaultValue: 'Залишилось' })}: {quota.remaining}
              </span>
              <Link
                to="/plans"
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
              >
                <span>{t('common:upgrade', { defaultValue: 'Апгрейд' })}</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          ) : (
            <span className="text-muted-foreground text-[11px]">
              {t('common:availableMore', { defaultValue: 'Доступно ще' })}:{' '}
              <strong className="text-foreground">{quota.remaining}</strong>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
