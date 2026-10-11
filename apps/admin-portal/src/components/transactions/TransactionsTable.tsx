'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentTransactionDto } from '@smartfeed/shared';
import { Clock, CreditCard } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { TransactionsFilterToolbar } from '@/components/transactions/TransactionsFilterToolbar';
import { TxColumnId, TX_COLUMNS } from '@/components/transactions/transactionsColumns.config';
import {
  TransactionStatusBadge,
  TransactionPlanBadge,
} from '@/components/transactions/TransactionBadges';
import { UserAvatarCell } from '@/components/ui/user-avatar-cell';

export interface TransactionsTableProps {
  transactions: PaymentTransactionDto[];
  isLoading: boolean;
  isUk: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  planFilter?: string;
  onPlanFilterChange?: (value: string) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
  onRefresh?: () => void;
}

export function TransactionsTable({
  transactions,
  isLoading,
  isUk,
  search = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  planFilter = 'ALL',
  onPlanFilterChange,
  onResetFilters,
  isFiltered = false,
  onRefresh,
}: TransactionsTableProps) {
  const { visibleColumns, toggleColumn, resetToDefaults, columnOptions } =
    useColumnVisibility<TxColumnId>('admin_transactions_columns', TX_COLUMNS, isUk);

  const { currentPage, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize } =
    usePagination(transactions, {
      initialPageSize: 10,
      resetDeps: [transactions],
    });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-sm">
      {/* Integrated Minimalist Toolbar */}
      {onSearchChange &&
        onStatusFilterChange &&
        onPlanFilterChange &&
        onResetFilters &&
        onRefresh && (
          <TransactionsFilterToolbar
            search={search}
            onSearchChange={onSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            planFilter={planFilter}
            onPlanFilterChange={onPlanFilterChange}
            onResetFilters={onResetFilters}
            isFiltered={isFiltered}
            onRefresh={onRefresh}
            isLoading={isLoading}
            isUk={isUk}
            columnOptions={columnOptions}
            onToggleColumn={toggleColumn}
            onResetColumns={resetToDefaults}
          />
        )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <Clock className="size-6 animate-spin mb-2 text-primary" />
          <p className="text-xs">
            {isUk ? 'Завантаження транзакцій...' : 'Loading transactions...'}
          </p>
        </div>
      ) : transactions.length === 0 ? (
        <div
          data-testid="transactions-empty-state"
          className="flex flex-col items-center justify-center p-12 text-center"
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
      ) : (
        <>
          <Table>
            <TableHeader className="bg-card border-b border-border">
              <TableRow className="text-xs">
                <TableHead className="w-[180px]">
                  {isUk ? 'Номер замовлення' : 'Order Ref'}
                </TableHead>
                <TableHead>{isUk ? 'Клієнт' : 'Customer'}</TableHead>
                {visibleColumns.plan !== false && <TableHead>{isUk ? 'Тариф' : 'Plan'}</TableHead>}
                {visibleColumns.interval !== false && (
                  <TableHead>{isUk ? 'Період' : 'Interval'}</TableHead>
                )}
                <TableHead className="text-right">{isUk ? 'Сума' : 'Amount'}</TableHead>
                <TableHead className="text-center">{isUk ? 'Статус' : 'Status'}</TableHead>
                {visibleColumns.gateway !== false && (
                  <TableHead>{isUk ? 'Шлюз / Картка' : 'Gateway / Card'}</TableHead>
                )}
                {visibleColumns.date !== false && (
                  <TableHead className="text-right">{isUk ? 'Дата' : 'Date'}</TableHead>
                )}
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
                      <UserAvatarCell
                        fullName={tx.userFullName}
                        email={tx.userEmail}
                        avatarUrl={tx.userAvatarUrl}
                        size="md"
                        showEmail
                      />
                    </TableCell>

                    {/* Plan */}
                    {visibleColumns.plan !== false && (
                      <TableCell>
                        <TransactionPlanBadge planCode={tx.planCode} />
                      </TableCell>
                    )}

                    {/* Interval */}
                    {visibleColumns.interval !== false && (
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
                    )}

                    {/* Amount */}
                    <TableCell className="text-right font-bold text-foreground tabular-nums">
                      {tx.amount.toLocaleString()} {tx.currency}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <TransactionStatusBadge status={tx.status} isUk={isUk} />
                    </TableCell>

                    {/* Gateway / Card */}
                    {visibleColumns.gateway !== false && (
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
                    )}

                    {/* Date */}
                    {visibleColumns.date !== false && (
                      <TableCell className="text-right text-muted-foreground font-mono text-[11px] tabular-nums">
                        {formattedDate}
                      </TableCell>
                    )}
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
        </>
      )}
    </div>
  );
}
