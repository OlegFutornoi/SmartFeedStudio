'use client';

import React from 'react';
import { Users, KeyRound, Database, Activity, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsersStatsDto } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStatsGridProps {
  stats: UsersStatsDto;
  isLoading: boolean;
}

export const DashboardStatsGrid = React.memo(function DashboardStatsGrid({
  stats,
  isLoading,
}: DashboardStatsGridProps) {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';

  return (
    <div data-testid="dashboard-stats-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Users */}
      <Card
        data-testid="stat-card-total-users"
        className="border-border bg-card shadow-xs transition-all"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'total_users')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] font-normal px-1.5 py-0 rounded-md border-border text-muted-foreground bg-muted/30 flex items-center gap-1"
            >
              <TrendingUp className="size-3" />
              <span>+12%</span>
            </Badge>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div
            data-testid="stat-value-total-users"
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            {isLoading ? '...' : stats.totalUsers}
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 flex items-center space-x-1.5 text-xs text-muted-foreground">
          <span>{t('dashboard', 'clients_count', { count: stats.standardUsersCount })}</span>
          <span>&bull;</span>
          <span>{t('dashboard', 'admins_count', { count: stats.superAdminsCount })}</span>
        </CardFooter>
      </Card>

      {/* 2. Active Licenses */}
      <Card
        data-testid="stat-card-active-licenses"
        className="border-border bg-card shadow-xs transition-all"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'active_licenses')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] font-normal px-1.5 py-0 rounded-md border-border text-muted-foreground bg-muted/30 flex items-center gap-1"
            >
              <ShieldCheck className="size-3" />
              <span>100%</span>
            </Badge>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div
            data-testid="stat-value-active-licenses"
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            {isLoading ? '...' : stats.activeLicenses}
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
          <p>{t('dashboard', 'licenses_sub')}</p>
        </CardFooter>
      </Card>

      {/* 3. Cloud Object Storage */}
      <Card
        data-testid="stat-card-storage"
        className="border-border bg-card shadow-xs transition-all"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'storage_title')}
          </CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pb-2">
          <div
            data-testid="stat-value-storage"
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            {t('dashboard', 'storage_active')}
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
          <p>
            {t('dashboard', 'storage_bucket')}:{' '}
            <span className="font-mono text-foreground">smartfeed-storage</span>
          </p>
        </CardFooter>
      </Card>

      {/* 4. Database & Infrastructure */}
      <Card
        data-testid="stat-card-database"
        className="border-border bg-card shadow-xs transition-all"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'database_title')}
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pb-2">
          <div
            data-testid="stat-value-database"
            className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{t('dashboard', 'database_status')}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
          <p>{t('dashboard', 'database_sub')}</p>
        </CardFooter>
      </Card>
    </div>
  );
});
