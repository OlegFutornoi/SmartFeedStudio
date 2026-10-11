'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { PaymentTransactionDto, PaymentStatsDto } from '@smartfeed/shared';
import { TransactionStatsCards } from '@/components/transactions/TransactionStatsCards';
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
  const [planFilter, setPlanFilter] = useState('ALL');
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

  const isFiltered = useMemo(() => {
    return Boolean(search.trim()) || statusFilter !== 'ALL' || planFilter !== 'ALL';
  }, [search, statusFilter, planFilter]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('ALL');
    setPlanFilter('ALL');
  }, []);

  const filteredTransactions = useMemo(() => {
    if (planFilter === 'ALL') return transactions;
    return transactions.filter((tx) => tx.planCode === planFilter);
  }, [transactions, planFilter]);

  return (
    <div
      data-testid="transactions-page"
      className="flex flex-col gap-6 max-w-7xl animate-in fade-in duration-300"
    >
      {/* Stats Cards */}
      <TransactionStatsCards stats={stats} isUk={isUk} />

      {/* Unified Transactions Table with Integrated Minimalist Toolbar */}
      <TransactionsTable
        transactions={filteredTransactions}
        isLoading={isLoading}
        isUk={isUk}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
        onRefresh={handleManualRefresh}
      />
    </div>
  );
}
