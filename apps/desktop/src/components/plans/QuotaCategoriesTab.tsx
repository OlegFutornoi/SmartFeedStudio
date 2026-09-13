import React from 'react';
import { Search, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProductCategorySummaryDto } from '@smartfeed/shared';

interface QuotaCategoriesTabProps {
  categories: ProductCategorySummaryDto[];
  filteredCategories: ProductCategorySummaryDto[];
  selectedCategoryIds: string[];
  deletingIds: Set<string>;
  categorySearch: string;
  isBulkDeleting: boolean;
  isUk: boolean;
  currentProductsUsed: number;
  maxProductsLimit: number;
  selectedProductsToDeleteCount: number;
  projectedRemainingProducts: number;
  isProjectedValid: boolean;
  onSearchChange: (val: string) => void;
  onToggleCategory: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDeleteSingleCategory: (category: ProductCategorySummaryDto) => void;
}

export const QuotaCategoriesTab: React.FC<QuotaCategoriesTabProps> = ({
  filteredCategories,
  selectedCategoryIds,
  deletingIds,
  categorySearch,
  isBulkDeleting,
  isUk,
  maxProductsLimit,
  selectedProductsToDeleteCount,
  projectedRemainingProducts,
  isProjectedValid,
  onSearchChange,
  onToggleCategory,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDeleteSingleCategory,
}) => {
  return (
    <div className="space-y-4">
      {/* Category Search & Quick Select Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isUk ? 'Пошук категорій...' : 'Search categories...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-2.5"
            onClick={onSelectAll}
            disabled={filteredCategories.length === 0 || isBulkDeleting}
          >
            {isUk ? 'Обрати всі' : 'Select all'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs px-2.5 text-muted-foreground"
            onClick={onDeselectAll}
            disabled={selectedCategoryIds.length === 0 || isBulkDeleting}
          >
            {isUk ? 'Зняти всі' : 'Deselect'}
          </Button>
        </div>
      </div>

      {/* Categories Checklist Table with 100% Solid Sticky Header */}
      <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-card">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 z-10 bg-muted border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="p-3 w-10 text-center">✓</th>
              <th className="p-3">{isUk ? 'Категорія' : 'Category'}</th>
              <th className="p-3">{isUk ? 'Постачальник' : 'Supplier'}</th>
              <th className="p-3 text-right">{isUk ? 'Кількість SKU' : 'SKU Count'}</th>
              <th className="p-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  {isUk ? 'Категорій не знайдено' : 'No categories found'}
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => {
                const isChecked = selectedCategoryIds.includes(cat.id);
                const isItemDeleting = deletingIds.has(cat.id);

                return (
                  <tr
                    key={cat.id}
                    className={`cursor-pointer transition-colors ${
                      isItemDeleting
                        ? 'opacity-60 bg-muted/30'
                        : isChecked
                          ? 'bg-destructive/10'
                          : 'hover:bg-muted/40'
                    }`}
                    onClick={() => onToggleCategory(cat.id)}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isItemDeleting || isBulkDeleting}
                        onChange={() => onToggleCategory(cat.id)}
                        className="h-4 w-4 rounded border-border accent-destructive focus:ring-destructive cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{isUk ? cat.nameUk : cat.nameEn || cat.nameUk}</span>
                        {isItemDeleting && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] animate-pulse px-1.5 py-0"
                          >
                            {isUk ? 'Видаляється...' : 'Deleting...'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{cat.supplierName || '—'}</td>
                    <td className="p-3 text-right font-mono font-semibold text-foreground">
                      {cat.productCount.toLocaleString()} SKU
                    </td>
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isItemDeleting || isBulkDeleting}
                        onClick={() => onDeleteSingleCategory(cat)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0 transition-colors"
                        title={
                          isUk
                            ? `Видалити категорію (${cat.productCount} SKU)`
                            : `Delete category (${cat.productCount} SKU)`
                        }
                        aria-label={isUk ? 'Видалити категорію' : 'Delete category'}
                        data-testid={`delete-category-btn-${cat.id}`}
                      >
                        {isItemDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Live Counter & Bulk Action */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {isUk ? 'Обрано до видалення:' : 'Selected to delete:'}
            </span>
            <Badge
              variant={selectedProductsToDeleteCount > 0 ? 'destructive' : 'secondary'}
              className="font-mono text-xs px-2 py-0.5"
            >
              {selectedProductsToDeleteCount.toLocaleString()} SKU
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span>{isUk ? 'Залишок після видалення:' : 'Remaining after delete:'}</span>
            <span
              className={`font-mono font-bold ${isProjectedValid ? 'text-emerald-500' : 'text-amber-500'}`}
            >
              {projectedRemainingProducts.toLocaleString()} / {maxProductsLimit.toLocaleString()}{' '}
              SKU
            </span>
            {isProjectedValid && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 inline" />}
          </div>
        </div>

        <Button
          size="sm"
          variant="destructive"
          disabled={selectedCategoryIds.length === 0 || isBulkDeleting}
          onClick={onDeleteSelected}
          data-testid="delete-selected-categories-btn"
          className="gap-1.5 h-8 px-3 text-xs shrink-0 shadow-sm"
        >
          {isBulkDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span>
            {isUk
              ? `Видалити обрані (${selectedProductsToDeleteCount.toLocaleString()} SKU)`
              : `Delete selected (${selectedProductsToDeleteCount.toLocaleString()} SKU)`}
          </span>
        </Button>
      </div>
    </div>
  );
};
