'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserListItemDto, PaymentTransactionDto, AdminLicenseItemDto } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardUsersTableTab } from '@/components/dashboard/DashboardUsersTableTab';
import { DashboardTransactionsTableTab } from '@/components/dashboard/DashboardTransactionsTableTab';
import { DashboardLicensesTableTab } from '@/components/dashboard/DashboardLicensesTableTab';

interface DashboardRecentUsersTableProps {
  users: UserListItemDto[];
  totalUsers: number;
  transactions?: PaymentTransactionDto[];
  totalTransactions?: number;
  licenses?: AdminLicenseItemDto[];
  totalLicenses?: number;
  isLoading: boolean;
}

type TabType = 'users' | 'transactions' | 'licenses';

export const DashboardRecentUsersTable = React.memo(function DashboardRecentUsersTable({
  users,
  totalUsers,
  transactions = [],
  totalTransactions = 0,
  licenses = [],
  totalLicenses = 0,
  isLoading,
}: DashboardRecentUsersTableProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === users.length ? [] : users.map((u) => u.id));
  };

  return (
    <Card
      data-testid="dashboard-recent-users-card"
      className="border-border/80 bg-card shadow-xs rounded-xl"
    >
      <CardHeader className="flex flex-col gap-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'users'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t('dashboard', 'tab_users')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
                {totalUsers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'transactions'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t('dashboard', 'tab_transactions')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
                {totalTransactions}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('licenses')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'licenses'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t('dashboard', 'tab_licenses')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
                {totalLicenses}
              </span>
            </button>
          </div>

          <Link
            href={
              activeTab === 'users'
                ? '/users'
                : activeTab === 'transactions'
                  ? '/transactions'
                  : '/licenses'
            }
          >
            <Button
              data-testid="view-all-users-btn"
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-primary hover:text-primary h-8"
            >
              <span>
                {activeTab === 'users'
                  ? t('dashboard', 'all_users_link', { count: totalUsers })
                  : activeTab === 'transactions'
                    ? t('dashboard', 'all_transactions_link', { count: totalTransactions })
                    : t('dashboard', 'all_licenses_link', { count: totalLicenses })}
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="pt-1">
          <CardTitle data-testid="recent-users-title" className="text-base font-semibold">
            {activeTab === 'users'
              ? t('dashboard', 'recent_users_title')
              : activeTab === 'transactions'
                ? t('dashboard', 'tab_transactions_title')
                : t('dashboard', 'tab_licenses_title')}
          </CardTitle>
          <CardDescription data-testid="recent-users-subtitle" className="text-xs">
            {activeTab === 'users'
              ? t('dashboard', 'recent_users_subtitle')
              : activeTab === 'transactions'
                ? t('dashboard', 'tab_transactions_desc')
                : t('dashboard', 'tab_licenses_desc')}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div
            data-testid="recent-users-loading"
            className="py-12 text-center text-sm text-muted-foreground animate-pulse"
          >
            {t('dashboard', 'clients_count', { count: 0 })}
          </div>
        ) : activeTab === 'users' ? (
          <DashboardUsersTableTab
            users={users}
            selectedIds={selectedIds}
            onToggleSelectRow={toggleSelectRow}
            onToggleSelectAll={toggleSelectAll}
          />
        ) : activeTab === 'transactions' ? (
          <DashboardTransactionsTableTab transactions={transactions} />
        ) : (
          <DashboardLicensesTableTab licenses={licenses} />
        )}
      </CardContent>
    </Card>
  );
});
