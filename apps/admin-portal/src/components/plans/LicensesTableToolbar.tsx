'use client';

import React from 'react';
import { Search, X, RotateCcw, ArrowUpDown, Layers, CheckCircle2, Cloud } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LicensesFacetedFilter, FacetedOption } from './LicensesFacetedFilter';

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
}: LicensesTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 p-4 border-b border-border bg-card/40">
      {/* Top row: Search input + Faceted Filters + Sort dropdown */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search input with leading icon and clear button */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
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
            className="pl-8 pr-7 h-8 text-xs bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              data-testid="licenses-search-clear-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
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

        {/* Sort selector */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpDown className="size-3" />
            <span className="hidden sm:inline">{isUk ? 'Сортування:' : 'Sort:'}</span>
          </div>
          <select
            data-testid="licenses-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="licenses-reset-filters-btn"
              onClick={onResetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              <span>{isUk ? 'Скинути' : 'Reset'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Results count & Active filters badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-2">
          <span data-testid="licenses-results-count" className="font-mono">
            {isUk
              ? `Показано ${filteredCount} з ${totalCount} ліцензій`
              : `Showing ${filteredCount} of ${totalCount} licenses`}
          </span>

          {isFiltered && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
              {isUk ? 'Фільтри активні' : 'Filters Active'}
            </Badge>
          )}
        </div>

        {/* Active filter pills */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-1.5">
            {searchQuery && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 px-1.5 py-0 font-normal"
                data-testid="active-filter-search"
              >
                <span>{`"${searchQuery}"`}</span>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            )}

            {selectedTier !== 'ALL' && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 px-1.5 py-0 font-normal"
                data-testid="active-filter-tier"
              >
                <span>{`Тариф: ${selectedTier}`}</span>
                <button
                  type="button"
                  onClick={() => onTierChange('ALL')}
                  className="hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            )}

            {selectedStatus !== 'ALL' && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 px-1.5 py-0 font-normal"
                data-testid="active-filter-status"
              >
                <span>{`Статус: ${selectedStatus}`}</span>
                <button
                  type="button"
                  onClick={() => onStatusChange('ALL')}
                  className="hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            )}

            {selectedCloud !== 'ALL' && (
              <Badge
                variant="secondary"
                className="text-[10px] gap-1 px-1.5 py-0 font-normal"
                data-testid="active-filter-cloud"
              >
                <span>{selectedCloud === 'WITH_CLOUD' ? 'S3 Активний' : 'Без S3'}</span>
                <button
                  type="button"
                  onClick={() => onCloudChange('ALL')}
                  className="hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
