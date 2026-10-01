'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GripVertical, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserListItemDto, PaymentTransactionDto, AdminLicenseItemDto } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <Card
      data-testid="dashboard-recent-users-card"
      className="border-border/80 bg-card shadow-xs rounded-xl"
    >
      {/* Top Segmented Controls Bar (shadcn dashboard-01) */}
      <CardHeader className="flex flex-col gap-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Pill Tabs with 100% Real Database Counts */}
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

          {/* View all link in top right corner */}
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

        {/* Dynamic section title & subtitle depending on active tab */}
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
          users.length === 0 ? (
            <div
              data-testid="recent-users-empty"
              className="py-12 text-center text-sm text-muted-foreground"
            >
              {t('dashboard', 'no_recent_users')}
            </div>
          ) : (
            <Table data-testid="recent-users-table">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/80">
                  <TableHead className="w-8 pl-4">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={selectedIds.length === users.length && users.length > 0}
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.length === users.length ? [] : users.map((u) => u.id),
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="w-6 p-0" />
                  <TableHead data-testid="th-recent-user" className="text-xs font-medium">
                    {t('dashboard', 'col_record')}
                  </TableHead>
                  <TableHead data-testid="th-recent-role" className="text-xs font-medium">
                    {t('dashboard', 'col_type')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_status')}
                  </TableHead>
                  <TableHead data-testid="th-recent-license" className="text-xs font-medium">
                    {t('dashboard', 'col_amount')}
                  </TableHead>
                  <TableHead data-testid="th-recent-registered" className="text-xs font-medium">
                    {t('dashboard', 'col_limit')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_reviewer')}
                  </TableHead>
                  <TableHead className="w-8 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    data-testid={`recent-user-row-${u.id}`}
                    className="transition-colors border-b border-border/50 hover:bg-muted/40"
                  >
                    <TableCell className="pl-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${u.fullName}`}
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelectRow(u.id)}
                        className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="p-0 text-muted-foreground/40">
                      <GripVertical className="h-3.5 w-3.5 cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">
                        {u.fullName || t('dashboard', 'unnamed_user')}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full px-2.5 py-0.5 text-xs font-normal border-border bg-muted/40 text-foreground"
                      >
                        {u.license?.planType ||
                          (u.role === 'SUPER_ADMIN'
                            ? 'Super Admin'
                            : u.role === 'ADMIN'
                              ? 'Admin'
                              : 'Starter')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1.5 font-normal bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Done</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-foreground">
                      {u.license?.maxXmlLimit
                        ? `${(u.license.maxXmlLimit / 1000).toFixed(0)}k`
                        : '18'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.license?.aiCredits !== undefined ? `${u.license.aiCredits}` : '0'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 shrink-0 border border-border">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {u.fullName ? u.fullName.slice(0, 2).toUpperCase() : 'AD'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                          {u.fullName || 'Admin'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : activeTab === 'transactions' ? (
          transactions.length === 0 ? (
            <div
              data-testid="recent-transactions-empty"
              className="py-12 text-center text-sm text-muted-foreground"
            >
              {t('dashboard', 'no_transactions')}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/80">
                  <TableHead className="w-8 pl-4" />
                  <TableHead className="w-6 p-0" />
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_record')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_type')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_status')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_amount')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_limit')}
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    {t('dashboard', 'col_reviewer')}
                  </TableHead>
                  <TableHead className="w-8 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="transition-colors border-b border-border/50 hover:bg-muted/40"
                  >
                    <TableCell className="pl-4" />
                    <TableCell className="p-0 text-muted-foreground/40">
                      <GripVertical className="h-3.5 w-3.5 cursor-grab" />
                    </TableCell>
                    <TableCell className="font-semibold text-sm font-mono text-foreground">
                      {tx.orderReference}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full px-2.5 py-0.5 text-xs font-normal border-border bg-muted/40 text-foreground"
                      >
                        {tx.planCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1.5 font-normal ${tx.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${tx.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                        <span>{tx.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      ₴{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {tx.provider}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                        {tx.userFullName || tx.userEmail || 'Client'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : licenses.length === 0 ? (
          <div
            data-testid="recent-licenses-empty"
            className="py-12 text-center text-sm text-muted-foreground"
          >
            {t('dashboard', 'no_licenses')}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/80">
                <TableHead className="w-8 pl-4" />
                <TableHead className="w-6 p-0" />
                <TableHead className="text-xs font-medium">
                  {t('dashboard', 'col_record')}
                </TableHead>
                <TableHead className="text-xs font-medium">{t('dashboard', 'col_type')}</TableHead>
                <TableHead className="text-xs font-medium">
                  {t('dashboard', 'col_status')}
                </TableHead>
                <TableHead className="text-xs font-medium">
                  {t('dashboard', 'col_amount')}
                </TableHead>
                <TableHead className="text-xs font-medium">{t('dashboard', 'col_limit')}</TableHead>
                <TableHead className="text-xs font-medium">
                  {t('dashboard', 'col_reviewer')}
                </TableHead>
                <TableHead className="w-8 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((lic) => (
                <TableRow
                  key={lic.id}
                  className="transition-colors border-b border-border/50 hover:bg-muted/40"
                >
                  <TableCell className="pl-4" />
                  <TableCell className="p-0 text-muted-foreground/40">
                    <GripVertical className="h-3.5 w-3.5 cursor-grab" />
                  </TableCell>
                  <TableCell className="font-semibold text-sm font-mono text-foreground truncate max-w-[160px]">
                    {lic.licenseKey}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2.5 py-0.5 text-xs font-normal border-border bg-muted/40 text-foreground"
                    >
                      {lic.planType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1.5 font-normal ${lic.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${lic.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                      />
                      <span>{lic.isActive ? 'Active' : 'Suspended'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium text-foreground">
                    {(lic.maxXmlLimit / 1000).toFixed(0)}k
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lic.aiCredits}</TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                      {lic.user?.fullName || lic.user?.email || 'User'}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});
