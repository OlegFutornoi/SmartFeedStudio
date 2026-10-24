import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, Rss, Layers, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/i18n';
import type { UserQuotasDto } from '@smartfeed/shared';

interface DashboardKpiGridProps {
  productsCount: number;
  suppliersCount: number;
  activeSuppliersCount: number;
  suppliersWithFeedsCount: number;
  feedsCount: number;
  totalRulesCount: number;
  skuLimit: number;
  skuPercent: number;
  planType?: string;
  quotas?: UserQuotasDto | null;
}

export const DashboardKpiGrid = React.memo(function DashboardKpiGrid({
  productsCount,
  suppliersCount,
  activeSuppliersCount,
  suppliersWithFeedsCount,
  feedsCount,
  totalRulesCount,
  skuLimit,
  skuPercent,
  planType = 'FREE',
  quotas,
}: DashboardKpiGridProps) {
  const { t, language } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const formatNum = (val: number) =>
    new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(val);

  const suppliersMax = quotas?.suppliers?.max ?? 5;
  const suppliersUnlimited = Boolean(quotas?.suppliers?.isUnlimited);
  const suppliersPercent = suppliersUnlimited
    ? 0
    : suppliersMax > 0
      ? Math.min(100, Math.round((suppliersCount / suppliersMax) * 100))
      : 0;

  const feedsMax = quotas?.feeds?.max ?? 10;
  const feedsUnlimited = Boolean(quotas?.feeds?.isUnlimited);
  const feedsPercent = feedsUnlimited
    ? 0
    : feedsMax > 0
      ? Math.min(100, Math.round((feedsCount / feedsMax) * 100))
      : 0;

  const productsUnlimited = Boolean(quotas?.products?.isUnlimited);
  const remainingSku = Math.max(0, skuLimit - productsCount);

  const cards = [
    {
      id: 'kpi-products',
      title: t('totalProducts'),
      value: formatNum(productsCount),
      badge: t('quotaBadge', { percent: skuPercent }),
      progress: productsUnlimited ? 10 : Math.min(100, skuPercent),
      isOver: !productsUnlimited && skuPercent >= 100,
      footerLeft: t('totalProductsDesc'),
      footerRight: productsUnlimited
        ? t('unlimitedLabel')
        : `${formatNum(productsCount)} / ${formatNum(skuLimit)}`,
      icon: Package,
      href: '/catalogs',
    },
    {
      id: 'kpi-suppliers',
      title: t('totalSuppliers'),
      value: formatNum(suppliersCount),
      badge: t('activeSuppliersBadge', { active: activeSuppliersCount }),
      progress: suppliersUnlimited ? 15 : suppliersPercent,
      isOver: !suppliersUnlimited && suppliersPercent >= 100,
      footerLeft: t('withFeedsCount', { count: suppliersWithFeedsCount }),
      footerRight: suppliersUnlimited ? t('unlimitedLabel') : `${suppliersCount} / ${suppliersMax}`,
      icon: Truck,
      href: '/suppliers',
    },
    {
      id: 'kpi-feeds',
      title: t('totalFeeds'),
      value: formatNum(feedsCount),
      badge: t('pricingRulesBadge', { count: totalRulesCount }),
      progress: feedsUnlimited ? 15 : feedsPercent,
      isOver: !feedsUnlimited && feedsPercent >= 100,
      footerLeft: t('totalFeedsDesc'),
      footerRight: feedsUnlimited ? t('unlimitedLabel') : `${feedsCount} / ${feedsMax}`,
      icon: Rss,
      href: '/suppliers',
    },
    {
      id: 'kpi-sku-quota',
      title: t('skuUtilization'),
      value: `${skuPercent}%`,
      badge: t('planLabel', { plan: planType }),
      progress: productsUnlimited ? 10 : Math.min(100, skuPercent),
      isOver: !productsUnlimited && skuPercent >= 100,
      footerLeft: productsUnlimited
        ? t('unlimitedLabel')
        : t('remainingSku', { count: formatNum(remainingSku) }),
      footerRight: t('skuLimitText', { limit: formatNum(skuLimit) }),
      icon: Layers,
      href: '/plans',
    },
  ];

  return (
    <div
      data-testid="dashboard-kpi-grid"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5"
    >
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.id}
            data-testid={item.id}
            className="group border-border/60 bg-card shadow-2xs hover:border-border transition-colors rounded-lg overflow-hidden"
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(item.href)}
              className="w-full h-auto block text-left font-normal p-4 hover:bg-transparent rounded-lg cursor-pointer"
            >
              {/* Row 1: Title + Icon (Overflow-proof with min-w-0 & shrink-0) */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-medium text-muted-foreground truncate min-w-0">
                  {item.title}
                </span>
                <div className="size-7 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors shrink-0">
                  <Icon className="size-3.5" />
                </div>
              </div>

              {/* Row 2: Metric Value + Context Badge */}
              <CardContent className="p-0 mt-2.5 flex items-baseline justify-between gap-2 min-w-0">
                <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground truncate min-w-0">
                  {item.value}
                </span>
                <Badge
                  variant="outline"
                  className="shrink-0 text-2xs font-medium px-1.5 py-0 h-5 rounded-sm bg-muted/40 border-border/60 text-muted-foreground tabular-nums"
                >
                  {item.badge}
                </Badge>
              </CardContent>

              {/* Row 3: Progress Bar + Sub-metrics */}
              <div className="mt-3 space-y-1.5">
                <Progress
                  value={item.progress}
                  className="h-1 bg-muted"
                  indicatorClassName={item.isOver ? 'bg-destructive' : 'bg-foreground/75'}
                />
                <div className="flex items-center justify-between gap-2 text-2xs text-muted-foreground min-w-0 pt-0.5">
                  <span className="truncate min-w-0">{item.footerLeft}</span>
                  <span className="flex items-center gap-0.5 font-mono tabular-nums text-foreground/80 shrink-0">
                    {item.footerRight}
                    <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </span>
                </div>
              </div>
            </Button>
          </Card>
        );
      })}
    </div>
  );
});
