import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowUpRight, Truck, Rss, Package, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/i18n';

interface DashboardReadinessCardProps {
  suppliersCount: number;
  feedsCount: number;
  productsCount: number;
  totalRulesCount: number;
}

export const DashboardReadinessCard = React.memo(function DashboardReadinessCard({
  suppliersCount,
  feedsCount,
  productsCount,
  totalRulesCount,
}: DashboardReadinessCardProps) {
  const { t, language } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const formatNum = (val: number) =>
    new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(val);

  const steps = [
    {
      id: 'step-suppliers',
      title: t('readinessStepSuppliers'),
      subtitle:
        suppliersCount > 0
          ? t('readinessStepSuppliersDone', { count: suppliersCount })
          : t('readinessStepSuppliersPending'),
      done: suppliersCount > 0,
      icon: Truck,
      href: '/suppliers',
    },
    {
      id: 'step-feeds',
      title: t('readinessStepFeeds'),
      subtitle:
        feedsCount > 0
          ? t('readinessStepFeedsDone', { count: feedsCount })
          : t('readinessStepFeedsPending'),
      done: feedsCount > 0,
      icon: Rss,
      href: '/suppliers',
    },
    {
      id: 'step-products',
      title: t('readinessStepProducts'),
      subtitle:
        productsCount > 0
          ? t('readinessStepProductsDone', { count: formatNum(productsCount) })
          : t('readinessStepProductsPending'),
      done: productsCount > 0,
      icon: Package,
      href: '/catalogs',
    },
    {
      id: 'step-rules',
      title: t('readinessStepRules'),
      subtitle:
        totalRulesCount > 0
          ? t('readinessStepRulesDone', { count: totalRulesCount })
          : t('readinessStepRulesPending'),
      done: totalRulesCount > 0,
      icon: Sliders,
      href: '/suppliers',
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const readinessPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <Card
      data-testid="dashboard-readiness-card"
      className="border-border/60 bg-card shadow-2xs rounded-lg flex flex-col justify-between h-full"
    >
      <CardHeader className="pb-3 pt-4 px-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground truncate">
              {t('readinessTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {t('readinessDesc')}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs font-mono tabular-nums px-2 py-0.5 rounded-sm ${
              readinessPercent === 100
                ? 'bg-success/15 text-success border-success/30'
                : 'bg-muted/50 text-foreground border-border/60'
            }`}
          >
            {readinessPercent}%
          </Badge>
        </div>

        <Progress
          value={readinessPercent}
          className="h-1.5 bg-muted"
          indicatorClassName="bg-foreground/75"
        />
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0 flex-1 flex flex-col justify-center">
        <div className="divide-y divide-border/40">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <Button
                key={step.id}
                type="button"
                variant="ghost"
                onClick={() => navigate(step.href)}
                className="group w-full h-auto flex items-center justify-between gap-2.5 py-2.5 px-2 text-left font-normal rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {step.done ? (
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/60 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        step.done ? 'text-foreground' : 'text-foreground/90'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-2xs text-muted-foreground truncate">{step.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <StepIcon className="size-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
