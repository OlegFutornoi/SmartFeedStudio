'use client';

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TransactionsFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isUk: boolean;
}

export function TransactionsFilterToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  isLoading,
  isUk,
}: TransactionsFilterToolbarProps) {
  return (
    <div
      data-testid="transactions-filter-toolbar"
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
    >
      <div className="flex flex-1 items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
          <Input
            data-testid="transactions-search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isUk ? 'Пошук за номером, email, ім’ям...' : 'Search by order #, email, name...'
            }
            className="h-9 pl-9 text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            data-testid="transactions-status-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-9 px-3 pr-8 rounded-md border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer appearance-none"
          >
            <option value="ALL">{isUk ? 'Всі статуси' : 'All statuses'}</option>
            <option value="APPROVED">{isUk ? 'Успішні (Approved)' : 'Approved'}</option>
            <option value="PENDING">{isUk ? 'Очікують (Pending)' : 'Pending'}</option>
            <option value="DECLINED">{isUk ? 'Відхилені (Declined)' : 'Declined'}</option>
          </select>
          <Filter className="size-3 text-muted-foreground absolute right-2.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Refresh button */}
      <Button
        variant="outline"
        size="sm"
        data-testid="transactions-refresh-btn"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-9 px-3 text-xs gap-1.5 self-end sm:self-auto"
      >
        <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isUk ? 'Оновити' : 'Refresh'}</span>
      </Button>
    </div>
  );
}
