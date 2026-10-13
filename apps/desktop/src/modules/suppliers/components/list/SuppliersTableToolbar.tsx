import React from 'react';
import { Search, Plus, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableViewOptions, ColumnOption } from '@/components/ui/DataTableViewOptions';
import { useTranslation } from '@/i18n';
import type { SupplierFiltersState, SupplierColumnId } from '@/modules/suppliers/types';

interface SuppliersTableToolbarProps {
  filters: SupplierFiltersState;
  pageSize: number;
  isSupplierLimitReached: boolean;
  onFilterChange: (patch: Partial<SupplierFiltersState>) => void;
  onPageSizeChange: (size: number) => void;
  onOpenCreate: () => void;
  onExport: () => void;
  columnOptions?: ColumnOption<SupplierColumnId>[];
  onToggleColumn?: (id: SupplierColumnId, isVisible: boolean) => void;
  onResetColumns?: () => void;
  isUk?: boolean;
}

export const SuppliersTableToolbar: React.FC<SuppliersTableToolbarProps> = ({
  filters,
  pageSize,
  isSupplierLimitReached,
  onFilterChange,
  onPageSizeChange,
  onOpenCreate,
  onExport,
  columnOptions,
  onToggleColumn,
  onResetColumns,
  isUk = true,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card/60 p-2.5 rounded-xl border border-border/70"
      data-testid="suppliers-table-toolbar"
    >
      {/* Left side: Clean Search Input */}
      <div className="flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder={t('suppliers:searchPlaceholder', {
              defaultValue: 'Пошук постачальників...',
            })}
            className="pl-8 h-8 text-xs bg-background/80"
            data-testid="search-suppliers-input"
          />
        </div>
      </div>

      {/* Right side: Actions, Page size, Customize Columns */}
      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
        <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
          <SelectTrigger className="h-8 text-xs w-[80px] bg-background/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="10">10 / стор</SelectItem>
            <SelectItem value="25">25 / стор</SelectItem>
            <SelectItem value="50">50 / стор</SelectItem>
          </SelectContent>
        </Select>

        {columnOptions && onToggleColumn && (
          <DataTableViewOptions<SupplierColumnId>
            columnOptions={columnOptions}
            onToggleColumn={onToggleColumn}
            onResetDefaults={onResetColumns}
            isUk={isUk}
          />
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-8 text-xs gap-1.5"
          data-testid="export-suppliers-btn"
        >
          <Upload className="size-3.5" />
          {t('common:export', { defaultValue: 'Експорт' })}
        </Button>

        <Button
          onClick={onOpenCreate}
          disabled={isSupplierLimitReached}
          size="sm"
          className="h-8 text-xs gap-1.5 shadow-xs"
          data-testid="add-supplier-header-btn"
          title={
            isSupplierLimitReached
              ? t('suppliers:limitReachedTooltip', {
                  defaultValue:
                    'Ліміт постачальників вичерпано. Підвищіть тариф або видаліть зайвих постачальників.',
                })
              : undefined
          }
        >
          <Plus className="size-3.5" />
          {t('suppliers:createSupplier', { defaultValue: 'Додати постачальника' })}
        </Button>
      </div>
    </div>
  );
};
