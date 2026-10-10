'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { PaymentTransactionDto, PaymentStatsDto } from '@smartfeed/shared';
import { TransactionStatsCards } from '@/components/transactions/TransactionStatsCards';
import { TransactionsFilterToolbar } from '@/components/transactions/TransactionsFilterToolbar';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';

export default function TransactionsPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [transactions, setTransactions] = useState<PaymentTransactionDto[]>([]);
  const [stats, setStats] = useState<PaymentStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const activeTxRequestRef = useRef(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load global stats once on initial mount
  useEffect(() => {
    api
      .getPaymentStats()
      .then(setStats)
      .catch((err) => console.error('Failed to load payment stats:', err));
  }, []);

  const loadTransactions = useCallback(async () => {
    const requestId = ++activeTxRequestRef.current;
    try {
      setIsLoading(true);

      const txRes = await api.getPaymentTransactions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
        limit: 100,
      });

      if (requestId === activeTxRequestRef.current) {
        setTransactions(txRes.transactions);
      }
    } catch (err) {
      console.error('Failed to load transactions data', err);
    } finally {
      if (requestId === activeTxRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleManualRefresh = useCallback(() => {
    api
      .getPaymentStats()
      .then(setStats)
      .catch(() => null);
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div
      data-testid="transactions-page"
      className="flex flex-col gap-6 max-w-7xl animate-in fade-in duration-300"
    >
      {/* Stats Cards */}
      <TransactionStatsCards stats={stats} isUk={isUk} />

      {/* Filter Toolbar */}
      <TransactionsFilterToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={handleManualRefresh}
        isLoading={isLoading}
        isUk={isUk}
      />

      {/* Transactions Table */}
      <TransactionsTable transactions={transactions} isLoading={isLoading} isUk={isUk} />
    </div>
  );
}
