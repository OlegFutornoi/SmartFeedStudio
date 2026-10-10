import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueGrowthPoint } from '@/modules/growth-showcase/types';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RevenueGrowthChartProps {
  timeline: RevenueGrowthPoint[];
  currentIndex: number;
  onHoverPoint: (index: number | null) => void;
  onSelectPoint: (index: number) => void;
  isUk: boolean;
}

const chartConfig: ChartConfig = {
  revenue: {
    label: 'Виручка',
    color: '#10b981', // emerald-500
  },
  profit: {
    label: 'Чистий прибуток',
    color: '#06b6d4', // cyan-500
  },
};

export function RevenueGrowthChart({
  timeline,
  currentIndex,
  onHoverPoint,
  onSelectPoint,
  isUk,
}: RevenueGrowthChartProps) {
  const currentPoint = timeline[currentIndex] || timeline[timeline.length - 1];

  const formatCurrency = (val: number) => {
    return isUk
      ? `₴${val.toLocaleString('uk-UA')}`
      : `$${Math.round(val / 37).toLocaleString('en-US')}`;
  };

  return (
    <div
      data-testid="growth-revenue-chart"
      className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-sm backdrop-blur-md"
    >
      {/* KPI Top Bar: Dynamic Live Currency Counter */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {isUk ? 'Ріст виручки на маркетплейсах' : 'Marketplace Revenue Growth'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {formatCurrency(currentPoint.revenue)}
            </span>
            <span className="text-[11px] text-muted-foreground">/ {isUk ? 'міс' : 'mo'}</span>
            <Badge
              variant="outline"
              className="gap-0.5 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>+{Math.round((currentPoint.revenue / timeline[0].revenue - 1) * 100)}%</span>
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium text-muted-foreground">
            {isUk ? 'Чистий прибуток' : 'Net Profit'}
          </span>
          <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(currentPoint.profit)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {currentPoint.ordersCount} {isUk ? 'замовлень' : 'orders'}
          </span>
        </div>
      </div>

      {/* Recharts Area Chart with Gradient Fills */}
      <div className="h-[105px] w-full pt-0.5">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeline}
              margin={{ top: 8, right: 6, left: -24, bottom: 0 }}
              onMouseMove={(e) => {
                if (e && e.activeTooltipIndex !== undefined) {
                  onHoverPoint(e.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => onHoverPoint(null)}
              onClick={(e) => {
                if (e && e.activeTooltipIndex !== undefined) {
                  onSelectPoint(e.activeTooltipIndex);
                }
              }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border) / 0.5)"
              />
              <XAxis
                dataKey={isUk ? 'monthLabelUk' : 'monthLabelEn'}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={9}
                tickFormatter={(val: string) => val.split(' ')[0] + ' ' + (val.split(' ')[1] || '')}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={9}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as RevenueGrowthPoint;
                  return (
                    <div className="rounded-lg border border-border bg-popover/95 p-2 shadow-xl backdrop-blur-md">
                      <div className="text-[11px] font-semibold text-foreground">
                        {isUk ? item.monthLabelUk : item.monthLabelEn}
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5 text-[10px]">
                        <div className="flex items-center justify-between gap-3 text-emerald-500 font-medium">
                          <span>{isUk ? 'Виручка:' : 'Revenue:'}</span>
                          <span className="font-mono">{formatCurrency(item.revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-cyan-500 font-medium">
                          <span>{isUk ? 'Прибуток:' : 'Profit:'}</span>
                          <span className="font-mono">{formatCurrency(item.profit)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-muted-foreground">
                          <span>{isUk ? 'Замовлення:' : 'Orders:'}</span>
                          <span className="font-mono">{item.ordersCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGrad)"
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#profitGrad)"
                activeDot={{ r: 4, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Legend & Milestone Steps Indicators */}
      <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{isUk ? 'Виручка' : 'Revenue'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="text-muted-foreground">{isUk ? 'Прибуток' : 'Profit'}</span>
          </div>
        </div>

        {/* Milestone Indicator dots */}
        <div className="flex items-center gap-1">
          {timeline.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPoint(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? 'w-4 bg-emerald-500 shadow-xs'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
              title={`Month ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
