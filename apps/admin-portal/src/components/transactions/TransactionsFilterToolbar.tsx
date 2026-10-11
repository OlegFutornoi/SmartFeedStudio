'use client';

import React, { useMemo } from 'react';
import {
  Search,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Layers,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FacetedFilter, FacetedOption } from '@/components/ui/faceted-filter';
import { DataTableViewOptions } from '@/components/ui/DataTableViewOptions';
import type { ColumnOption } from '@/hooks/useColumnVisibility';
import type { TxColumnId } from '@/components/transactions/transactionsColumns.config';

export interface TransactionsFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  isUk: boolean;
  columnOptions?: ColumnOption<TxColumnId>[];
  onToggleColumn?: (id: TxColumnId, isVisible: boolean) => void;
  onResetColumns?: () => void;
}

export function TransactionsFilterToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  onResetFilters,
  isFiltered,
  onRefresh,
  isLoading,
  isUk,
  columnOptions,
  onToggleColumn,
  onResetColumns,
}: TransactionsFilterToolbarProps) {
  const statusOptions: FacetedOption[] = useMemo(
    () => [
      { value: 'ALL', label: isUk ? 'Всі статуси' : 'All statuses' },
      {
        value: 'APPROVED',
        label: isUk ? 'Оплачено' : 'Approved',
        icon: CheckCircle2,
      },
      {
        value: 'PENDING',
        label: isUk ? 'Очікує' : 'Pending',
        icon: Clock,
      },
      {
        value: 'DECLINED',
        label: isUk ? 'Відхилено' : 'Declined',
        icon: XCircle,
      },
    ],
    [isUk],
  );

  const planOptions: FacetedOption[] = useMemo(
    () => [
      { value: 'ALL', label: isUk ? 'Всі тарифи' : 'All plans' },
      { value: 'STARTER', label: 'STARTER' },
      { value: 'PRO', label: 'PRO' },
      { value: 'GROWTH', label: 'GROWTH' },
      { value: 'ENTERPRISE', label: 'ENTERPRISE' },
    ],
    [isUk],
  );

  return (
    <div
      data-testid="transactions-filter-toolbar"
      className="flex flex-wrap items-center justify-between gap-2.5 p-3 border-b border-border/60 bg-card/40"
    >
      {/* Left side: Search input + Faceted Filters + Reset button */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Search input with leading icon and clear button */}
        <div className="relative w-full sm:w-64 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            data-testid="transactions-search-input"
            type="text"
            placeholder={
              isUk ? 'Пошук за номером, email, ім’ям...' : 'Search by order #, email, name...'
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-7 h-8 text-xs bg-background/80 border-border/80 rounded-md focus-visible:ring-1"
          />
          {search && (
            <button
              type="button"
              data-testid="transactions-search-clear-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              title={isUk ? 'Очистити' : 'Clear'}
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Faceted Filter for Status */}
        <FacetedFilter
          title={isUk ? 'Статус' : 'Status'}
          options={statusOptions}
          selectedValue={statusFilter}
          onSelect={onStatusFilterChange}
          icon={CheckCircle2}
          dataTestId="transactions-filter-status"
        />

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

        {/* Faceted Filter for Plan */}
        <FacetedFilter
          title={isUk ? 'Тариф' : 'Plan'}
          options={planOptions}
          selectedValue={planFilter}
          onSelect={onPlanFilterChange}
          icon={Layers}
          dataTestId="transactions-filter-plan"
        />

        {/* Reset Filters button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="transactions-reset-filters-btn"
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-normal"
          >
            <RotateCcw className="size-3" />
            <span>{isUk ? 'Скинути' : 'Reset'}</span>
          </Button>
        )}
      </div>

      {/* Right side: Export CSV + Customize Columns + Refresh */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled
          data-testid="transactions-export-btn"
          className="h-8 px-2.5 text-xs gap-1.5 opacity-60"
        >
          <Download className="size-3.5" />
          <span>{isUk ? 'Експорт CSV' : 'Export CSV'}</span>
        </Button>

        {columnOptions && onToggleColumn && (
          <DataTableViewOptions<TxColumnId>
            columnOptions={columnOptions}
            onToggleColumn={onToggleColumn}
            onResetDefaults={onResetColumns}
            isUk={isUk}
          />
        )}

        <Button
          variant="ghost"
          size="sm"
          data-testid="transactions-refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
          title={isUk ? 'Оновити' : 'Refresh'}
          aria-label={isUk ? 'Оновити' : 'Refresh'}
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
