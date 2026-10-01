'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  UserListItemDto,
  UsersStatsDto,
  PaymentStatsDto,
  PaymentTransactionDto,
  AdminLicenseItemDto,
} from '@smartfeed/shared';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { AdminActivityChart } from '@/components/dashboard/AdminActivityChart';
import { DashboardRecentUsersTable } from '@/components/dashboard/DashboardRecentUsersTable';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<UsersStatsDto>({
    totalUsers: 0,
    activeLicenses: 0,
    superAdminsCount: 0,
    standardUsersCount: 0,
  });
  const [paymentStats, setPaymentStats] = useState<PaymentStatsDto | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserListItemDto[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransactionDto[]>([]);
  const [recentLicenses, setRecentLicenses] = useState<AdminLicenseItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, usersData, paymentData, txData, licensesData] = await Promise.all([
          api.getUsersStats(),
          api.getUsers({ limit: 5 }),
          api.getPaymentStats().catch(() => null),
          api.getPaymentTransactions({ limit: 5 }).catch(() => ({ transactions: [], total: 0 })),
          api.getAdminLicenses().catch(() => []),
        ]);
        setStats(statsData);
        setRecentUsers(usersData);
        if (paymentData) setPaymentStats(paymentData);
        if (txData?.transactions) setRecentTransactions(txData.transactions);
        if (Array.isArray(licensesData)) setRecentLicenses(licensesData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div
      data-testid="dashboard-overview-page"
      className="space-y-6 animate-in fade-in duration-300"
    >
      {/* 1. Primary Metrics Grid (Strictly real DB data, dashboard-01) */}
      <DashboardStatsGrid stats={stats} paymentStats={paymentStats} isLoading={isLoading} />

      {/* 2. Interactive Activity & Growth Trends Chart (dashboard-01) */}
      <AdminActivityChart
        totalUsers={stats.totalUsers}
        activeLicenses={stats.activeLicenses}
        users={recentUsers}
      />

      {/* 3. Full-Width Data Table with Segmented Tabs (dashboard-01) */}
      <DashboardRecentUsersTable
        users={recentUsers.slice(0, 5)}
        totalUsers={stats.totalUsers}
        transactions={recentTransactions}
        totalTransactions={paymentStats?.successfulCount ?? recentTransactions.length}
        licenses={recentLicenses}
        totalLicenses={stats.activeLicenses}
        isLoading={isLoading}
      />
    </div>
  );
}
