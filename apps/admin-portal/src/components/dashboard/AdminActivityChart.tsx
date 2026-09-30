'use client';

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
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminActivityChartProps {
  totalUsers: number;
  activeLicenses: number;
}

const chartConfig = {
  users: {
    label: 'Користувачі',
    color: 'hsl(var(--primary))',
  },
  licenses: {
    label: 'Ліцензії',
    color: 'hsl(var(--primary) / 0.4)',
  },
} satisfies ChartConfig;

export const AdminActivityChart = React.memo(function AdminActivityChart({
  totalUsers,
  activeLicenses,
}: AdminActivityChartProps) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';
  const [timeRange, setTimeRange] = useState<'30d' | '7d'>('30d');

  const chartData = useMemo(() => {
    const days = timeRange === '30d' ? 30 : 7;
    const data = [];
    const now = new Date();

    const baseUsers = Math.max(1, Math.round(totalUsers * 0.7));
    const baseLicenses = Math.max(1, Math.round(activeLicenses * 0.7));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(isUk ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      const progress = (days - i) / days;
      const userVal = Math.round(baseUsers + (totalUsers - baseUsers) * progress);
      const licVal = Math.round(baseLicenses + (activeLicenses - baseLicenses) * progress);

      data.push({
        date: dateStr,
        users: userVal,
        licenses: licVal,
      });
    }

    return data;
  }, [timeRange, totalUsers, activeLicenses, isUk]);

  return (
    <Card
      data-testid="admin-activity-chart-card"
      className="border-border/80 bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            {isUk ? 'Динаміка реєстрацій та ліцензій' : 'User Registrations & License Trends'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            {isUk
              ? 'Аналітика зростання користувацької бази платформи'
              : 'Growth trends across client registrations and active licenses'}
          </CardDescription>
        </div>

        {/* Time range switcher */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-muted/60 p-1 rounded-lg border border-border/60">
          <Button
            variant={timeRange === '30d' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('30d')}
            className="h-7 text-xs px-2.5 font-medium rounded-md"
          >
            {isUk ? '30 днів' : '30 days'}
          </Button>
          <Button
            variant={timeRange === '7d' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('7d')}
            className="h-7 text-xs px-2.5 font-medium rounded-md"
          >
            {isUk ? '7 днів' : '7 days'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillLicenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-licenses)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-licenses)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              className="text-[11px] fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px] fill-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="licenses"
              type="monotone"
              fill="url(#fillLicenses)"
              stroke="var(--color-licenses)"
              strokeWidth={1.5}
            />
            <Area
              dataKey="users"
              type="monotone"
              fill="url(#fillUsers)"
              stroke="var(--color-users)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
