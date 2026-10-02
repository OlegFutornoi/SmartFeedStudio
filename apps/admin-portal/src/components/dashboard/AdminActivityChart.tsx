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

import { UserListItemDto } from '@smartfeed/shared';

interface AdminActivityChartProps {
  totalUsers: number;
  activeLicenses: number;
  users?: UserListItemDto[];
}

type TimeRange = '90d' | '30d' | '7d';

const chartConfig = {
  users: {
    label: 'Користувачі',
    color: 'hsl(var(--foreground))',
  },
  licenses: {
    label: 'Ліцензії',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export const AdminActivityChart = React.memo(function AdminActivityChart({
  totalUsers,
  activeLicenses,
  users = [],
}: AdminActivityChartProps) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const chartData = useMemo(() => {
    const days = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7;
    const data = [];
    const now = new Date();

    // Parse actual user & license creation timestamps from PostgreSQL records
    const userTimestamps = users.map((u) => new Date(u.createdAt).getTime()).sort((a, b) => a - b);
    const licenseTimestamps = users
      .filter((u) => u.license && u.license.isActive)
      .map((u) => new Date(u.createdAt).getTime())
      .sort((a, b) => a - b);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(23, 59, 59, 999);
      const dayEndMs = d.getTime();

      const dateStr = d.toLocaleDateString(isUk ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      // Pure database data: count actual users and active licenses created on or before this day
      let usersCount = 0;
      let licensesCount = 0;

      if (userTimestamps.length > 0) {
        usersCount = userTimestamps.filter((t) => t <= dayEndMs).length;
        licensesCount = licenseTimestamps.filter((t) => t <= dayEndMs).length;
      } else {
        // When user list is empty, strictly reflect real database counts
        usersCount = totalUsers;
        licensesCount = activeLicenses;
      }

      data.push({
        date: dateStr,
        users: usersCount,
        licenses: licensesCount,
      });
    }

    return data;
  }, [timeRange, totalUsers, activeLicenses, users, isUk]);

  const rangeSubtitle = useMemo(() => {
    if (timeRange === '90d') {
      return isUk ? 'Дані за останні 3 місяці' : 'Total for the last 3 months';
    }
    if (timeRange === '30d') {
      return isUk ? 'Дані за останні 30 днів' : 'Total for the last 30 days';
    }
    return isUk ? 'Дані за останні 7 днів' : 'Total for the last 7 days';
  }, [timeRange, isUk]);

  return (
    <Card
      data-testid="admin-activity-chart-card"
      className="border border-border/60 bg-card rounded-2xl shadow-xs transition-all"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-4 px-6 pt-5">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">
            {isUk ? 'Динаміка активності та ліцензій' : 'Total Visitors & Licenses'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {rangeSubtitle}
          </CardDescription>
        </div>

        {/* Segmented Time Range Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
          <Button
            variant={timeRange === '90d' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('90d')}
            className="h-7 text-xs px-2.5 font-medium rounded-lg"
          >
            {isUk ? '3 місяці' : 'Last 3 months'}
          </Button>
          <Button
            variant={timeRange === '30d' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('30d')}
            className="h-7 text-xs px-2.5 font-medium rounded-lg"
          >
            {isUk ? '30 днів' : 'Last 30 days'}
          </Button>
          <Button
            variant={timeRange === '7d' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('7d')}
            className="h-7 text-xs px-2.5 font-medium rounded-lg"
          >
            {isUk ? '7 днів' : 'Last 7 days'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-4 pt-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-[170px] w-full">
          <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {/* Layer 1: Darker smooth topographical gradient */}
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
              </linearGradient>

              {/* Layer 2: Soft subtle underlying gradient */}
              <linearGradient id="fillLicenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={28}
              className="text-xs fill-muted-foreground"
            />

            {/* Hidden Y-Axis for pure edge-to-edge minimalist SaaS look */}
            <YAxis hide domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax * 1.25))]} />

            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="line" />}
            />

            <Area
              dataKey="licenses"
              type="natural"
              fill="url(#fillLicenses)"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
            />

            <Area
              dataKey="users"
              type="natural"
              fill="url(#fillUsers)"
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
