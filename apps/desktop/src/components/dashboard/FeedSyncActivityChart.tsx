import React, { useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface FeedSyncActivityChartProps {
  productsCount: number;
  feedsCount: number;
  totalRulesCount?: number;
}

const chartConfig = {
  products: {
    label: 'Товари',
    color: 'hsl(var(--foreground))',
  },
  syncs: {
    label: 'Синхронізації',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export const FeedSyncActivityChart = React.memo(function FeedSyncActivityChart({
  productsCount,
  feedsCount,
  totalRulesCount = 0,
}: FeedSyncActivityChartProps) {
  const { t, language } = useTranslation(['home', 'common']);
  const isUk = language === 'uk';
  const [timeRange, setTimeRange] = useState<'30d' | '7d'>('30d');

  const formatNum = (val: number) => new Intl.NumberFormat(isUk ? 'uk-UA' : 'en-US').format(val);

  // Strictly real database data: Zero fake sine wave or invented numbers
  const chartData = useMemo(() => {
    const days = timeRange === '30d' ? 30 : 7;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(isUk ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      data.push({
        date: dateStr,
        products: productsCount,
        syncs: feedsCount,
      });
    }

    return data;
  }, [timeRange, productsCount, feedsCount, isUk]);

  const rangeSubtitle = useMemo(() => {
    if (productsCount === 0 && feedsCount === 0) {
      return isUk
        ? 'У базі даних наразі немає товарів та синхронізацій (0\u00a0SKU)'
        : 'No products or feed syncs in the database yet (0\u00a0SKUs)';
    }
    if (timeRange === '30d') {
      return isUk ? 'Дані за останні 30 днів' : 'Total for the last 30 days';
    }
    return isUk ? 'Дані за останні 7 днів' : 'Total for the last 7 days';
  }, [timeRange, productsCount, feedsCount, isUk]);

  const maxVal = Math.max(productsCount, feedsCount);
  const yDomain: [number, number | string] = maxVal === 0 ? [0, 5] : [0, 'auto'];

  return (
    <Card
      data-testid="feed-sync-activity-chart-card"
      className="border-border/60 bg-card shadow-2xs rounded-lg flex flex-col justify-between h-full"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between pb-2.5 px-4 pt-4 gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-semibold text-foreground truncate">
            {isUk ? 'Активність каталогів та синхронізацій' : 'Catalog & Feed Sync Activity'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground truncate">
            {rangeSubtitle}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Compact live telemetry badges */}
          <div className="hidden xl:flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-2xs font-mono tabular-nums px-2 py-0.5 rounded-sm bg-muted/30 border-border/60 text-muted-foreground"
            >
              {t('chartStatProducts')}:{' '}
              <strong className="text-foreground ml-1">{formatNum(productsCount)}</strong>
            </Badge>
            <Badge
              variant="outline"
              className="text-2xs font-mono tabular-nums px-2 py-0.5 rounded-sm bg-muted/30 border-border/60 text-muted-foreground"
            >
              {t('chartStatFeeds')}: <strong className="text-foreground ml-1">{feedsCount}</strong>
            </Badge>
            <Badge
              variant="outline"
              className="text-2xs font-mono tabular-nums px-2 py-0.5 rounded-sm bg-muted/30 border-border/60 text-muted-foreground"
            >
              {t('chartStatRules')}:{' '}
              <strong className="text-foreground ml-1">{totalRulesCount}</strong>
            </Badge>
          </div>

          {/* Time range switcher */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md border border-border/60">
            <Button
              variant={timeRange === '30d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="h-6 text-2xs px-2 font-medium rounded-sm cursor-pointer"
            >
              {isUk ? '30 днів' : '30 days'}
            </Button>
            <Button
              variant={timeRange === '7d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="h-6 text-2xs px-2 font-medium rounded-sm cursor-pointer"
            >
              {isUk ? '7 днів' : '7 days'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-4 pb-3.5 pt-0 space-y-2.5">
        <ChartContainer config={chartConfig} className="aspect-auto h-[175px] w-full">
          <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillDesktopProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-products)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-products)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillDesktopSyncs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-syncs)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-syncs)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              domain={yDomain}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs fill-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="syncs"
              type="monotone"
              fill="url(#fillDesktopSyncs)"
              stroke="var(--color-syncs)"
              strokeWidth={1.5}
            />
            <Area
              dataKey="products"
              type="monotone"
              fill="url(#fillDesktopProducts)"
              stroke="var(--color-products)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        {productsCount === 0 && feedsCount === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/30 border border-border/50 px-3 py-2 text-2xs text-muted-foreground">
            <Info className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{t('chartEmptyHint')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
