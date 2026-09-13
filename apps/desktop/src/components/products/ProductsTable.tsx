import React from 'react';
import { PackageSearch } from 'lucide-react';
import { ProductTableRow } from './ProductTableRow';
import { TablePagination } from '@/components/ui/table-pagination';
import { useTranslation } from '@/i18n';
import type { ProductDto } from '@smartfeed/shared';

interface ProductsTableProps {
  products: ProductDto[];
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
  isLoading?: boolean;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
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
  isLoading = false,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  return (
    <div
      data-testid="products-table-container"
      className="space-y-4 rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden"
    >
      <div className="overflow-x-auto relative min-h-[300px]">
        <table data-testid="products-table" className="w-full text-left border-collapse">
          {/* 100% Solid Sticky Header */}
          <thead className="sticky top-0 z-10 bg-card border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 w-10 text-center bg-card">
                <input
                  type="checkbox"
                  data-testid="select-all-products-checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-input accent-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-12 bg-card">{t('catalogs:colImage')}</th>
              <th className="py-3 px-3 bg-card">{t('catalogs:colSku')}</th>
              <th className="py-3 px-3 bg-card">{t('catalogs:colTitle')}</th>
              <th className="py-3 px-3 bg-card">{t('catalogs:colSupplier')}</th>
              <th className="py-3 px-3 bg-card">{t('catalogs:colRetailPrice')}</th>
              <th className="py-3 px-3 bg-card">{t('catalogs:colMargin')}</th>
              <th className="py-3 px-3 bg-card">{t('catalogs:colStock')}</th>
              <th className="py-3 px-3 text-right bg-card">{t('catalogs:colActions')}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={9} className="py-4 px-4">
                    <div className="h-6 bg-muted/40 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={9} className="py-12 px-4 text-center">
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
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  isSelected={selectedIds.includes(product.id)}
                  onToggleSelect={onToggleSelect}
                  onViewDetails={onViewDetails}
                  onDeleteProduct={onDeleteProduct}
                />
              ))
            )}
          </tbody>
        </table>
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
