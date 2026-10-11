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
import { PaymentTransactionDto } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatarCell } from '@/components/ui/user-avatar-cell';
import { StatusBadge } from '@/components/ui/status-badge';

export interface DashboardTransactionsTableTabProps {
  transactions: PaymentTransactionDto[];
}

export const DashboardTransactionsTableTab = React.memo(function DashboardTransactionsTableTab({
  transactions,
}: DashboardTransactionsTableTabProps) {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';

  if (transactions.length === 0) {
    return (
      <div
        data-testid="recent-transactions-empty"
        className="py-12 text-center text-sm text-muted-foreground"
      >
        {t('dashboard', 'no_transactions')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow className="hover:bg-transparent border-b border-border/80">
          <TableHead className="w-8 pl-4" />
          <TableHead className="w-6 p-0" />
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_record')}</TableHead>
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_type')}</TableHead>
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_status')}</TableHead>
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_amount')}</TableHead>
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_limit')}</TableHead>
          <TableHead className="text-xs font-medium">{t('dashboard', 'col_reviewer')}</TableHead>
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
              <StatusBadge status={tx.status} isUk={isUk} />
            </TableCell>
            <TableCell className="font-mono text-sm font-semibold text-foreground">
              ₴{tx.amount.toLocaleString()}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground font-mono">{tx.provider}</TableCell>
            <TableCell>
              <UserAvatarCell
                fullName={tx.userFullName}
                email={tx.userEmail}
                avatarUrl={tx.userAvatarUrl}
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
