'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { UserListItemDto } from '@smartfeed/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardRecentUsersTableProps {
  users: UserListItemDto[];
  totalUsers: number;
  isLoading: boolean;
}

export const DashboardRecentUsersTable = React.memo(function DashboardRecentUsersTable({
  users,
  totalUsers,
  isLoading,
}: DashboardRecentUsersTableProps) {
  const { t, locale } = useLanguage();

  return (
    <Card
      data-testid="dashboard-recent-users-card"
      className="md:col-span-5 border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle data-testid="recent-users-title" className="text-lg font-semibold">
            {t('dashboard', 'recent_users_title')}
          </CardTitle>
          <CardDescription data-testid="recent-users-subtitle">
            {t('dashboard', 'recent_users_subtitle')}
          </CardDescription>
        </div>
        <Link href="/users">
          <Button
            data-testid="view-all-users-btn"
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-primary hover:text-primary"
          >
            <span>{t('dashboard', 'all_users_link', { count: totalUsers })}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div
            data-testid="recent-users-loading"
            className="py-12 text-center text-sm text-muted-foreground animate-pulse"
          >
            {t('users', 'loading_users')}
          </div>
        ) : users.length === 0 ? (
          <div
            data-testid="recent-users-empty"
            className="py-12 text-center text-sm text-muted-foreground"
          >
            {t('dashboard', 'no_recent_users')}
          </div>
        ) : (
          <Table data-testid="recent-users-table">
            <TableHeader>
              <TableRow>
                <TableHead data-testid="th-recent-user">{t('dashboard', 'col_user')}</TableHead>
                <TableHead data-testid="th-recent-role">{t('dashboard', 'col_role')}</TableHead>
                <TableHead data-testid="th-recent-license">
                  {t('dashboard', 'col_license')}
                </TableHead>
                <TableHead data-testid="th-recent-registered" className="text-right">
                  {t('dashboard', 'col_registered')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} data-testid={`recent-user-row-${u.id}`}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {u.fullName || t('dashboard', 'unnamed_user')}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : u.role === 'ADMIN'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-secondary text-secondary-foreground'
                      }
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.license ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      >
                        {u.license.planType}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
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
