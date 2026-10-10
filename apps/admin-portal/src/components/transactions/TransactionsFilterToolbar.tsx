'use client';

import React from 'react';
import { Search, Filter, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-9 w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{isUk ? 'Всі статуси' : 'All statuses'}</SelectItem>
              <SelectItem value="APPROVED">{isUk ? 'Успішні (Approved)' : 'Approved'}</SelectItem>
              <SelectItem value="PENDING">{isUk ? 'Очікують (Pending)' : 'Pending'}</SelectItem>
              <SelectItem value="DECLINED">{isUk ? 'Відхилені (Declined)' : 'Declined'}</SelectItem>
            </SelectContent>
          </Select>

          {/* Hidden native select for test selector compatibility */}
          <select
            data-testid="transactions-status-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="sr-only pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          >
            <option value="ALL">{isUk ? 'Всі статуси' : 'All statuses'}</option>
            <option value="APPROVED">{isUk ? 'Успішні (Approved)' : 'Approved'}</option>
            <option value="PENDING">{isUk ? 'Очікують (Pending)' : 'Pending'}</option>
            <option value="DECLINED">{isUk ? 'Відхилені (Declined)' : 'Declined'}</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          disabled
          data-testid="transactions-export-btn"
          className="h-9 px-3 text-xs gap-1.5 opacity-60"
        >
          <Download className="size-3.5" />
          <span>{isUk ? 'Експорт CSV' : 'Export CSV'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          data-testid="transactions-refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 px-3 text-xs gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isUk ? 'Оновити' : 'Refresh'}</span>
        </Button>
      </div>
    </div>
  );
}
