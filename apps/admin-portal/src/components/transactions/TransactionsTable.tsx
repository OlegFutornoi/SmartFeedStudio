'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { PaymentTransactionDto } from '@smartfeed/shared';
import { CheckCircle2, Clock, XCircle, CreditCard } from 'lucide-react';
import { TablePagination } from '../ui/table-pagination';
import { usePagination } from '../../hooks/usePagination';

interface TransactionsTableProps {
  transactions: PaymentTransactionDto[];
  isLoading: boolean;
  isUk: boolean;
}

export function TransactionsTable({ transactions, isLoading, isUk }: TransactionsTableProps) {
  const { currentPage, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize } =
    usePagination(transactions, {
      initialPageSize: 10,
      resetDeps: [transactions],
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <Clock className="size-6 animate-spin mb-2 text-primary" />
        <p className="text-xs">{isUk ? 'Завантаження транзакцій...' : 'Loading transactions...'}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        data-testid="transactions-empty-state"
        className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border"
      >
        <CreditCard className="size-8 text-muted-foreground mb-2" />
        <h3 className="text-sm font-semibold text-foreground">
          {isUk ? 'Транзакцій не знайдено' : 'No transactions found'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {isUk
            ? 'Тут відображатимуться всі створені рахунки, успішні оплати та відхилені спроби клієнтів.'
            : 'All created invoices, successful payments, and declined customer attempts will appear here.'}
        </p>
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 gap-1 text-[11px]">
            <CheckCircle2 className="size-3" />
            <span>{isUk ? 'Оплачено' : 'Approved'}</span>
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1 text-[11px]"
          >
            <Clock className="size-3" />
            <span>{isUk ? 'Очікує' : 'Pending'}</span>
          </Badge>
        );
      case 'DECLINED':
        return (
          <Badge
            variant="destructive"
            className="bg-destructive/10 text-destructive border-destructive/30 gap-1 text-[11px]"
          >
            <XCircle className="size-3" />
            <span>{isUk ? 'Відхилено' : 'Declined'}</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderPlanBadge = (planCode: string) => {
    const isPro = planCode === 'PRO';
    const isEnterprise = planCode === 'ENTERPRISE';

    return (
      <Badge
        variant="outline"
        className={`text-[10px] uppercase font-bold tracking-wider ${
          isEnterprise
            ? 'bg-primary/20 text-primary border-primary/40'
            : isPro
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground'
        }`}
      >
        {planCode}
      </Badge>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="text-xs">
            <TableHead className="w-[180px]">{isUk ? 'Номер замовлення' : 'Order Ref'}</TableHead>
            <TableHead>{isUk ? 'Клієнт' : 'Customer'}</TableHead>
            <TableHead>{isUk ? 'Тариф' : 'Plan'}</TableHead>
            <TableHead>{isUk ? 'Період' : 'Interval'}</TableHead>
            <TableHead className="text-right">{isUk ? 'Сума' : 'Amount'}</TableHead>
            <TableHead className="text-center">{isUk ? 'Статус' : 'Status'}</TableHead>
            <TableHead>{isUk ? 'Шлюз / Картка' : 'Gateway / Card'}</TableHead>
            <TableHead className="text-right">{isUk ? 'Дата' : 'Date'}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedItems.map((tx) => {
            const formattedDate = new Date(tx.createdAt).toLocaleDateString(
              isUk ? 'uk-UA' : 'en-US',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              },
            );

            return (
              <TableRow
                key={tx.id}
                data-testid={`transaction-row-${tx.orderReference}`}
                className="text-xs hover:bg-muted/30 transition-colors"
              >
                {/* Order Reference */}
                <TableCell className="font-mono font-medium text-foreground">
                  {tx.orderReference}
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {tx.userFullName || tx.userEmail?.split('@')[0]}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {tx.userEmail}
                    </span>
                  </div>
                </TableCell>

                {/* Plan */}
                <TableCell>{renderPlanBadge(tx.planCode)}</TableCell>

                {/* Interval */}
                <TableCell>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {tx.billingInterval === 'YEARLY'
                      ? isUk
                        ? '1 рік (-20%)'
                        : '1 Year (-20%)'
                      : isUk
                        ? '1 місяць'
                        : '1 Month'}
                  </span>
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right font-bold text-foreground">
                  {tx.amount.toLocaleString()} {tx.currency}
                </TableCell>

                {/* Status */}
                <TableCell className="text-center">{renderStatusBadge(tx.status)}</TableCell>

                {/* Gateway / Card */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <CreditCard className="size-3 text-muted-foreground" />
                      <span>{tx.provider}</span>
                    </span>
                    {tx.cardPan ? (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {tx.cardPan} {tx.cardType ? `(${tx.cardType})` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        {tx.failureReason || '—'}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Date */}
                <TableCell className="text-right text-muted-foreground font-mono text-[11px]">
                  {formattedDate}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        isUk={isUk}
        testIdPrefix="transactions-pagination"
      />
    </div>
  );
}
