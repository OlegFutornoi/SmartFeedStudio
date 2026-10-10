'use client';

import React from 'react';
import {
  Search,
  X,
  RotateCcw,
  ArrowUpDown,
  Layers,
  CheckCircle2,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LicensesFacetedFilter, FacetedOption } from '@/components/plans/LicensesFacetedFilter';

interface LicensesTableToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  tierOptions: FacetedOption[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusOptions: FacetedOption[];
  selectedCloud: string;
  onCloudChange: (cloud: string) => void;
  cloudOptions: FacetedOption[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOptions: { value: string; label: string }[];
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
  onResetFilters: () => void;
  isUk: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export const LicensesTableToolbar = React.memo(function LicensesTableToolbar({
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  tierOptions,
  selectedStatus,
  onStatusChange,
  statusOptions,
  selectedCloud,
  onCloudChange,
  cloudOptions,
  sortBy,
  onSortChange,
  sortOptions,
  totalCount,
  filteredCount,
  isFiltered,
  onResetFilters,
  isUk,
  isLoading,
  isRefreshing,
  onRefresh,
}: LicensesTableToolbarProps) {
  return (
    <div
      data-testid="licenses-table-toolbar"
      className="flex flex-col gap-2.5 p-3 border-b border-border/60 bg-card/40"
    >
      {/* Main row: Search + Faceted Filters + Reset + Sort + Count Badge + Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left side: Search input + Faceted Filters + Reset button */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search input with leading icon and clear button */}
          <div className="relative w-full sm:w-64 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              data-testid="licenses-search-input"
              type="text"
              placeholder={
                isUk
                  ? "Пошук за ключем, email або ім'ям..."
                  : 'Search by key, email or customer name...'
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs bg-background/80 border-border/80 rounded-md focus-visible:ring-1"
            />
            {searchQuery && (
              <button
                type="button"
                data-testid="licenses-search-clear-btn"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                title={isUk ? 'Очистити' : 'Clear'}
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Faceted Filter for Plan Tier */}
          <LicensesFacetedFilter
            title={isUk ? 'Тариф' : 'Plan'}
            options={tierOptions}
            selectedValue={selectedTier}
            onSelect={onTierChange}
            icon={Layers}
            dataTestId="licenses-filter-tier"
          />

          {/* Faceted Filter for Status */}
          <LicensesFacetedFilter
            title={isUk ? 'Статус' : 'Status'}
            options={statusOptions}
            selectedValue={selectedStatus}
            onSelect={onStatusChange}
            icon={CheckCircle2}
            dataTestId="licenses-filter-status"
          />

          {/* Faceted Filter for Cloud S3 */}
          <LicensesFacetedFilter
            title={isUk ? 'S3 Бекап' : 'S3 Backup'}
            options={cloudOptions}
            selectedValue={selectedCloud}
            onSelect={onCloudChange}
            icon={Cloud}
            dataTestId="licenses-filter-cloud"
          />

          {/* Reset Filters button */}
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="licenses-reset-filters-btn"
              onClick={onResetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 font-normal"
            >
              <RotateCcw className="size-3" />
              <span>{isUk ? 'Скинути' : 'Reset'}</span>
            </Button>
          )}
        </div>

        {/* Right side: Sort selector + Results Count Badge + Refresh Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpDown className="size-3" />
            <span className="hidden sm:inline">{isUk ? 'Сортування:' : 'Sort:'}</span>
          </div>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger
              data-testid="licenses-sort-select"
              className="h-8 w-[140px] sm:w-[170px] text-xs bg-background/80 border-border/80"
            >
              <SelectValue placeholder={isUk ? 'Сортування' : 'Sort by'} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge
            data-testid="licenses-results-count"
            variant="outline"
            className="h-7 text-xs font-normal border-border/60 bg-background/60 text-muted-foreground px-2.5 rounded-md font-mono"
          >
            {isUk
              ? `Показано ${filteredCount} з ${totalCount} ліцензій`
              : `Showing ${filteredCount} of ${totalCount} licenses`}
          </Badge>

          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              data-testid="refresh-licenses-btn"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              title={isUk ? 'Оновити' : 'Refresh'}
              aria-label={isUk ? 'Оновити' : 'Refresh'}
            >
              <RefreshCw
                className={`size-3.5 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
