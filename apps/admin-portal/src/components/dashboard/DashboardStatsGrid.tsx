'use client';

import React from 'react';
import { Users, KeyRound, Database, Activity, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { UsersStatsDto } from '@smartfeed/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardStatsGridProps {
  stats: UsersStatsDto;
  isLoading: boolean;
}

export const DashboardStatsGrid = React.memo(function DashboardStatsGrid({
  stats,
  isLoading,
}: DashboardStatsGridProps) {
  const { t } = useLanguage();

  return (
    <div data-testid="dashboard-stats-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Main Focus Metric: Total Users */}
      <Card
        data-testid="stat-card-total-users"
        className="border-border/80 bg-card/60 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition-all shadow-md"
      >
        <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'total_users')}
          </CardTitle>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            data-testid="stat-value-total-users"
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            {isLoading ? '...' : stats.totalUsers}
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-2">
            <span className="text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
              {t('dashboard', 'clients_count', { count: stats.standardUsersCount })}
            </span>
            <span>&bull;</span>
            <span>{t('dashboard', 'admins_count', { count: stats.superAdminsCount })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Licenses */}
      <Card
        data-testid="stat-card-active-licenses"
        className="border-border/80 bg-card/60 backdrop-blur-sm group hover:border-emerald-500/50 transition-all shadow-md"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'active_licenses')}
          </CardTitle>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <KeyRound className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            data-testid="stat-value-active-licenses"
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            {isLoading ? '...' : stats.activeLicenses}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t('dashboard', 'licenses_sub')}</p>
        </CardContent>
      </Card>

      {/* Cloud Object Storage */}
      <Card
        data-testid="stat-card-storage"
        className="border-border/80 bg-card/60 backdrop-blur-sm group hover:border-blue-500/50 transition-all shadow-md"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'storage_title')}
          </CardTitle>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Database className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            data-testid="stat-value-storage"
            className="text-3xl font-bold tracking-tight text-foreground"
          >
            {t('dashboard', 'storage_active')}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('dashboard', 'storage_bucket')}:{' '}
            <span className="font-mono text-foreground">smartfeed-storage</span>
          </p>
        </CardContent>
      </Card>

      {/* Database & Infrastructure */}
      <Card
        data-testid="stat-card-database"
        className="border-border/80 bg-card/60 backdrop-blur-sm group hover:border-purple-500/50 transition-all shadow-md"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard', 'database_title')}
          </CardTitle>
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            data-testid="stat-value-database"
            className="text-3xl font-bold tracking-tight text-emerald-400 flex items-center gap-1.5"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('dashboard', 'database_status')}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t('dashboard', 'database_sub')}</p>
        </CardContent>
      </Card>
    </div>
  );
});
