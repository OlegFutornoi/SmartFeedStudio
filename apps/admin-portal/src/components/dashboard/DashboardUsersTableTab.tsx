'use client';

import React from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
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
import { UserListItemDto } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

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
              {u.license?.maxXmlLimit ? `${(u.license.maxXmlLimit / 1000).toFixed(0)}k` : '18'}
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
  );
});
