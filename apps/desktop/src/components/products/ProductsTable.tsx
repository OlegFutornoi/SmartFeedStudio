import React from 'react';
import { PackageSearch } from 'lucide-react';
import { ProductTableRow, ProductColumnId } from '@/components/products/ProductTableRow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { useTranslation } from '@/i18n';
import type { ProductDto, SupplierDto } from '@smartfeed/shared';

interface ProductsTableProps {
  products: ProductDto[];
  suppliers?: SupplierDto[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  onViewDetails: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
  onResetFilters?: () => void;
  isLoading?: boolean;
  visibleColumns?: Record<ProductColumnId, boolean>;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  suppliers,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
  onViewDetails,
  onDeleteProduct,
  onResetFilters,
  isLoading = false,
  visibleColumns,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  const activeColCount =
    4 +
    (visibleColumns?.image !== false ? 1 : 0) +
    (visibleColumns?.supplier !== false ? 1 : 0) +
    (visibleColumns?.price !== false ? 1 : 0) +
    (visibleColumns?.margin !== false ? 1 : 0) +
    (visibleColumns?.stock !== false ? 1 : 0);

  return (
    <div
      data-testid="products-table-container"
      className="space-y-4 rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden"
    >
      <div className="overflow-x-auto relative min-h-[300px]">
        <Table data-testid="products-table">
          {/* 100% Solid Sticky Header */}
          <TableHeader className="sticky top-0 z-10 bg-card border-b border-border">
            <TableRow className="bg-muted/30">
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  data-testid="select-all-products-checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-input accent-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
              </TableHead>
              {visibleColumns?.image !== false && (
                <TableHead className="w-14 text-center">{t('catalogs:colImage')}</TableHead>
              )}
              <TableHead className="min-w-[120px]">{t('catalogs:colSku')}</TableHead>
              <TableHead className="max-w-[280px]">{t('catalogs:colTitle')}</TableHead>
              {visibleColumns?.supplier !== false && (
                <TableHead>{t('catalogs:colSupplier')}</TableHead>
              )}
              {visibleColumns?.price !== false && (
                <TableHead>{t('catalogs:colRetailPrice')}</TableHead>
              )}
              {visibleColumns?.margin !== false && <TableHead>{t('catalogs:colMargin')}</TableHead>}
              {visibleColumns?.stock !== false && <TableHead>{t('catalogs:colStock')}</TableHead>}
              <TableHead className="text-right">{t('catalogs:colActions')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} className="animate-pulse">
                  <TableCell colSpan={activeColCount} className="py-4 px-4">
                    <div className="h-6 bg-muted/40 rounded-md w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (products || []).length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={activeColCount} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-muted/30 rounded-full text-muted-foreground">
                      <PackageSearch className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('catalogs:noProductsFound')}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {t('catalogs:noProductsFoundDesc')}
                    </p>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        data-testid="table-reset-filters-btn"
                        className="mt-2 text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {t('catalogs:resetFilters')}
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              (products || []).map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  suppliers={suppliers}
                  isSelected={selectedIds.includes(product.id)}
                  onToggleSelect={onToggleSelect}
                  onViewDetails={onViewDetails}
                  onDeleteProduct={onDeleteProduct}
                  visibleColumns={visibleColumns}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className="p-3 border-t border-border/40 bg-card">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
};
