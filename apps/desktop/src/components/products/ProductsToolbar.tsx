import React from 'react';
import { Search, FilterX, Truck, FolderTree } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';
import { ProductColumnId } from '@/components/products/ProductTableRow';
import { DataTableViewOptions, ColumnOption } from '@/components/ui/DataTableViewOptions';

interface ProductsToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedSupplierId: string;
  onSupplierChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (val: boolean) => void;
  suppliers: SupplierDto[];
  categories: string[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  totalCount?: number;
  columnOptions?: ColumnOption<ProductColumnId>[];
  onToggleColumn?: (id: ProductColumnId, isVisible: boolean) => void;
  onResetColumns?: () => void;
  isUk?: boolean;
}

export const ProductsToolbar: React.FC<ProductsToolbarProps> = ({
  search,
  onSearchChange,
  selectedSupplierId,
  onSupplierChange,
  selectedCategory,
  onCategoryChange,
  inStockOnly,
  onInStockOnlyChange,
  suppliers,
  categories,
  onResetFilters,
  hasActiveFilters,
  totalCount: _totalCount,
  columnOptions,
  onToggleColumn,
  onResetColumns,
  isUk: isUkProp,
}) => {
  const { t, language } = useTranslation(['catalogs', 'common']);
  const isUk = isUkProp !== undefined ? isUkProp : language === 'uk';

  return (
    <div className="space-y-3" data-testid="products-toolbar">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left side: Search input + Filter controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Compact Search input */}
          <div className="relative w-full sm:w-64 max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              data-testid="products-search-input"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('catalogs:searchProductsPlaceholder')}
              className="h-9 text-xs pl-9 bg-card border-border/70 placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Supplier filter */}
          <Select
            value={selectedSupplierId || 'all'}
            onValueChange={(val) => onSupplierChange(val === 'all' ? '' : val)}
          >
            <SelectTrigger
              data-testid="filter-supplier-select"
              className="h-9 w-[150px] sm:w-[170px] text-xs font-medium"
            >
              <div className="flex items-center gap-2 truncate">
                <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder={t('catalogs:allSuppliers')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('catalogs:allSuppliers')}</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select
            value={selectedCategory || 'all'}
            onValueChange={(val) => onCategoryChange(val === 'all' ? '' : val)}
          >
            <SelectTrigger
              data-testid="filter-category-select"
              className="h-9 w-[150px] sm:w-[180px] text-xs font-medium"
            >
              <div className="flex items-center gap-2 truncate">
                <FolderTree className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder={t('catalogs:allCategories')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('catalogs:allCategories')}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* In Stock toggle button */}
          <Button
            type="button"
            variant={inStockOnly ? 'secondary' : 'outline'}
            size="sm"
            data-testid="filter-instock-toggle"
            onClick={() => onInStockOnlyChange(!inStockOnly)}
            className={`h-9 text-xs transition-colors ${
              inStockOnly
                ? 'bg-muted text-foreground border-border font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <span
              className={`mr-1.5 h-2 w-2 rounded-full ${inStockOnly ? 'bg-foreground' : 'bg-muted-foreground/40'}`}
            />
            {t('catalogs:inStockOnly')}
          </Button>

          {/* Reset button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="reset-filters-button"
              onClick={onResetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <FilterX className="h-3.5 w-3.5 mr-1" />
              {t('catalogs:resetFilters')}
            </Button>
          )}
        </div>

        {/* Right side: Customize Columns Options */}
        {columnOptions && onToggleColumn && (
          <div className="shrink-0">
            <DataTableViewOptions<ProductColumnId>
              columnOptions={columnOptions}
              onToggleColumn={onToggleColumn}
              onResetDefaults={onResetColumns}
              isUk={isUk}
            />
          </div>
        )}
      </div>
    </div>
  );
};
