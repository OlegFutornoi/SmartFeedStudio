'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Receipt, Download } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useLanguage } from '../../../contexts/LanguageContext';
import { api } from '../../../lib/api';
import { PaymentTransactionDto, PaymentStatsDto } from '@smartfeed/shared';
import { TransactionStatsCards } from '../../../components/transactions/TransactionStatsCards';
import { TransactionsFilterToolbar } from '../../../components/transactions/TransactionsFilterToolbar';
import { TransactionsTable } from '../../../components/transactions/TransactionsTable';

export default function TransactionsPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [transactions, setTransactions] = useState<PaymentTransactionDto[]>([]);
  const [stats, setStats] = useState<PaymentStatsDto | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [txRes, statsRes] = await Promise.all([
        api.getPaymentTransactions({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: search.trim() ? search.trim() : undefined,
          limit: 100,
        }),
        api.getPaymentStats(),
      ]);

      setTransactions(txRes.transactions);
      setTotal(txRes.total);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load transactions data', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div
      data-testid="transactions-page"
      className="flex flex-col gap-6 max-w-7xl animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1
            data-testid="transactions-header-title"
            className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5"
          >
            <Receipt className="size-6 text-primary" />
            <span>{isUk ? 'Журнал транзакцій' : 'Payment Transactions'}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isUk
              ? 'Історія всіх оплат, виставлених рахунків, статусів WayForPay та фінансової аналітики'
              : 'Audit log of all client invoices, WayForPay transactions, payment statuses, and revenue analytics'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1.5 opacity-60">
            <Download className="size-3.5" />
            <span>{isUk ? 'Експорт CSV' : 'Export CSV'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <TransactionStatsCards stats={stats} isUk={isUk} />

      {/* Filter Toolbar */}
      <TransactionsFilterToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={loadData}
        isLoading={isLoading}
        isUk={isUk}
      />

      {/* Transactions Table */}
      <TransactionsTable transactions={transactions} isLoading={isLoading} isUk={isUk} />
    </div>
  );
}
