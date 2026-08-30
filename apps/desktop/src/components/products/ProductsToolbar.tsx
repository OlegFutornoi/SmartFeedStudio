import React from 'react';
import { Search, FilterX, Building2, FolderTree } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

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
  totalCount: number;
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
  totalCount,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  return (
    <div className="space-y-3" data-testid="products-toolbar">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="products-search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('catalogs:searchProductsPlaceholder')}
            className="pl-9 bg-card"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Supplier filter */}
          <div className="relative flex items-center">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              data-testid="filter-supplier-select"
              value={selectedSupplierId}
              onChange={(e) => onSupplierChange(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">{t('catalogs:allSuppliers')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="relative flex items-center">
            <FolderTree className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              data-testid="filter-category-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">{t('catalogs:allCategories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* In Stock toggle button */}
          <Button
            type="button"
            variant={inStockOnly ? 'secondary' : 'outline'}
            size="sm"
            data-testid="filter-instock-toggle"
            onClick={() => onInStockOnlyChange(!inStockOnly)}
            className={`h-9 text-xs transition-colors ${
              inStockOnly
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <span
              className={`mr-1.5 h-2 w-2 rounded-full ${inStockOnly ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
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

          {/* Total Counter Badge */}
          <Badge variant="outline" className="h-9 px-3 text-xs bg-muted/30 ml-auto lg:ml-0">
            {t('catalogs:totalProductsCount', { count: totalCount.toLocaleString() })}
          </Badge>
        </div>
      </div>
    </div>
  );
};
