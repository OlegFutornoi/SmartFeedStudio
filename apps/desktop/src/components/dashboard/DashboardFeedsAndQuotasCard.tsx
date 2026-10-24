import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rss, Clock, Package, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/i18n';
import type { FeedSourceDto, UserQuotasDto } from '@smartfeed/shared';

interface DashboardFeedsAndQuotasCardProps {
  feedSources: FeedSourceDto[];
  productsCount: number;
  suppliersCount: number;
  feedsCount: number;
  skuLimit: number;
  quotas?: UserQuotasDto | null;
}

export const DashboardFeedsAndQuotasCard = React.memo(function DashboardFeedsAndQuotasCard({
  feedSources,
  productsCount,
  suppliersCount,
  feedsCount,
  skuLimit,
  quotas,
}: DashboardFeedsAndQuotasCardProps) {
  const { t, language } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const formatNum = (val: number) =>
    new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US').format(val);

  const quotaRows = [
    {
      id: 'q-products',
      label: t('quotaProductsLabel'),
      used: productsCount,
      max: skuLimit,
      isUnlimited: Boolean(quotas?.products?.isUnlimited),
    },
    {
      id: 'q-suppliers',
      label: t('quotaSuppliersLabel'),
      used: suppliersCount,
      max: quotas?.suppliers?.max ?? 5,
      isUnlimited: Boolean(quotas?.suppliers?.isUnlimited),
    },
    {
      id: 'q-feeds',
      label: t('quotaFeedsLabel'),
      used: feedsCount,
      max: quotas?.feeds?.max ?? 10,
      isUnlimited: Boolean(quotas?.feeds?.isUnlimited),
    },
    {
      id: 'q-ai',
      label: t('quotaAiLabel'),
      used: quotas?.aiCredits?.used ?? 0,
      max: quotas?.aiCredits?.max ?? 100,
      isUnlimited: Boolean(quotas?.aiCredits?.isUnlimited),
    },
  ];

  return (
    <Card
      data-testid="dashboard-feeds-quotas-card"
      className="border-border/60 bg-card shadow-2xs rounded-lg flex flex-col justify-between h-full"
    >
      <Tabs defaultValue="feeds" className="w-full flex flex-col h-full">
        <CardHeader className="pb-3 pt-4 px-4 space-y-2.5 border-b border-border/50 bg-muted/15">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold text-foreground truncate">
                {t('feedsPanelTitle')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {t('feedsPanelDesc')}
              </CardDescription>
            </div>

            <TabsList className="h-7 p-0.5 bg-muted/70 rounded-md shrink-0">
              <TabsTrigger
                value="feeds"
                className="h-6 text-2xs px-2.5 py-0 rounded-sm cursor-pointer"
              >
                {t('tabFeeds')} ({feedSources.length})
              </TabsTrigger>
              <TabsTrigger
                value="quotas"
                className="h-6 text-2xs px-2.5 py-0 rounded-sm cursor-pointer"
              >
                {t('tabQuotas')}
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="p-3 flex-1 flex flex-col justify-between">
          {/* Tab 1: Active Feed Sources */}
          <TabsContent value="feeds" className="mt-0 flex-1 flex flex-col justify-center">
            {feedSources.length === 0 ? (
              <div className="py-6 px-3 text-center space-y-2.5">
                <div className="size-9 rounded-md bg-muted/60 border border-border/50 flex items-center justify-center text-muted-foreground mx-auto">
                  <FileSpreadsheet className="size-4" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <p className="text-xs font-medium text-foreground">{t('noFeedsYetTitle')}</p>
                  <p className="text-2xs text-muted-foreground leading-relaxed text-pretty">
                    {t('noFeedsYetDesc')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/suppliers')}
                  className="h-7 text-xs px-3 rounded-md gap-1 cursor-pointer mt-1"
                >
                  <span>{t('goToSuppliersBtn')}</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {feedSources.slice(0, 4).map((feed) => (
                  <Button
                    key={feed.id}
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/suppliers')}
                    className="group w-full h-auto flex items-center justify-between gap-2.5 py-2.5 px-2 text-left font-normal rounded-md hover:bg-muted/35 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0">
                        <Rss className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            {feed.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-2xs px-1 py-0 h-4 rounded-sm font-mono uppercase border-border/60 text-muted-foreground shrink-0"
                          >
                            {feed.fileFormat?.includes('CSV') ? 'CSV' : 'XML'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2.5 text-2xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1 tabular-nums">
                            <Package className="size-3" />
                            {t('productsCount', { count: formatNum(feed.productsCount ?? 0) })}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Clock className="size-3" />
                            {t('feedSyncInterval', { hours: feed.syncIntervalHours ?? 24 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Resource Quotas Breakdown */}
          <TabsContent
            value="quotas"
            className="mt-0 flex-1 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-3 pt-1">
              {quotaRows.map((row) => {
                const percent = row.isUnlimited
                  ? 10
                  : row.max > 0
                    ? Math.min(100, Math.round((row.used / row.max) * 100))
                    : 0;
                const isOver = !row.isUnlimited && row.used >= row.max;

                return (
                  <div key={row.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                      <span className="text-muted-foreground truncate">{row.label}</span>
                      <span className="font-mono tabular-nums text-foreground font-medium shrink-0">
                        {formatNum(row.used)} / {row.isUnlimited ? '∞' : formatNum(row.max)}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className="h-1.5 bg-muted"
                      indicatorClassName={isOver ? 'bg-destructive' : 'bg-foreground/75'}
                    />
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/plans')}
              className="w-full h-7 text-xs rounded-md gap-1.5 border-border/60 cursor-pointer"
            >
              <span>{t('managePlanBtn')}</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
});
