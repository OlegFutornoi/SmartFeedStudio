'use client';

import React from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserListItemDto } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatarCell } from '@/components/ui/user-avatar-cell';
import { StatusBadge } from '@/components/ui/status-badge';

export interface DashboardUsersTableTabProps {
  users: UserListItemDto[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
}

export const DashboardUsersTableTab = React.memo(function DashboardUsersTableTab({
  users,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
}: DashboardUsersTableTabProps) {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';

  if (users.length === 0) {
    return (
      <div
        data-testid="recent-users-empty"
        className="py-12 text-center text-sm text-muted-foreground"
      >
        {t('dashboard', 'no_recent_users')}
      </div>
    );
  }

  return (
    <Table data-testid="recent-users-table">
      <TableHeader className="bg-muted/30">
        <TableRow className="hover:bg-transparent border-b border-border/80">
          <TableHead className="w-8 pl-4">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={selectedIds.length === users.length && users.length > 0}
              onChange={onToggleSelectAll}
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
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_status')}</TableHead>
          <TableHead data-testid="th-recent-license" className="text-xs font-medium">
            {t('dashboard', 'col_amount')}
          </TableHead>
          <TableHead data-testid="th-recent-registered" className="text-xs font-medium">
            {t('dashboard', 'col_limit')}
          </TableHead>
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_reviewer')}</TableHead>
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
                onChange={() => onToggleSelectRow(u.id)}
                className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
            </TableCell>
            <TableCell className="p-0 text-muted-foreground/40">
              <GripVertical className="h-3.5 w-3.5 cursor-grab" />
            </TableCell>
            <TableCell>
              <UserAvatarCell
                fullName={u.fullName}
                email={u.email}
                avatarUrl={u.avatarUrl}
                size="md"
                showEmail
                className="max-w-[200px]"
              />
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
              <StatusBadge status="ACTIVE" label={isUk ? 'Активний' : 'Active'} isUk={isUk} />
            </TableCell>
            <TableCell className="font-mono text-sm font-medium text-foreground">
              {u.license?.maxXmlLimit ? `${(u.license.maxXmlLimit / 1000).toFixed(0)}k` : '18'}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {u.license?.aiCredits !== undefined ? `${u.license.aiCredits}` : '0'}
            </TableCell>
            <TableCell>
              <UserAvatarCell
                fullName={u.fullName || 'Admin'}
                avatarUrl={u.avatarUrl}
                size="sm"
                className="max-w-[140px]"
              />
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
  );
});
