'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { UserListItemDto, UsersStatsDto } from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWelcomeBanner } from '@/components/dashboard/DashboardWelcomeBanner';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { AdminActivityChart } from '@/components/dashboard/AdminActivityChart';
import { DashboardRecentUsersTable } from '@/components/dashboard/DashboardRecentUsersTable';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';

const ChangePasswordDialog = dynamic(
  () =>
    import('../../components/profile/change-password-dialog').then((m) => ({
      default: m.ChangePasswordDialog,
    })),
  { ssr: false },
);

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsersStatsDto>({
    totalUsers: 0,
    activeLicenses: 0,
    superAdminsCount: 0,
    standardUsersCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, usersData] = await Promise.all([
          api.getUsersStats(),
          api.getUsers({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentUsers(usersData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleOpenPasswordDialog = useCallback(() => {
    setPasswordDialogOpen(true);
  }, []);

  return (
    <div
      data-testid="dashboard-overview-page"
      className="space-y-8 animate-in fade-in duration-300"
    >
      {/* Welcome Banner */}
      <DashboardWelcomeBanner user={user} onOpenPasswordDialog={handleOpenPasswordDialog} />

      {/* Primary Metrics Grid */}
      <DashboardStatsGrid stats={stats} isLoading={isLoading} />

      {/* Interactive Activity & Growth Trends Chart (dashboard-01) */}
      <AdminActivityChart totalUsers={stats.totalUsers} activeLicenses={stats.activeLicenses} />

      {/* Main Content & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-7">
        <DashboardRecentUsersTable
          users={recentUsers}
          totalUsers={stats.totalUsers}
          isLoading={isLoading}
        />
        <DashboardQuickActions
          totalUsers={stats.totalUsers}
          onOpenPasswordDialog={handleOpenPasswordDialog}
        />
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  );
}
