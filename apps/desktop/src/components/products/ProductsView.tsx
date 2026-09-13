import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProductsToolbar } from './ProductsToolbar';
import { ProductsBulkActionsBar } from './ProductsBulkActionsBar';
import { ProductsTable } from './ProductsTable';
import { ProductDetailsDrawer } from './ProductDetailsDrawer';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { localDb } from '@/services/local-db';
import { useDataSync } from '@/lib/syncEvents';
import { useTranslation } from '@/i18n';
import type { ProductDto, SupplierDto } from '@smartfeed/shared';

export const ProductsView: React.FC = () => {
  const { t } = useTranslation(['catalogs', 'common']);

  // Data state
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Metadata for filter dropdowns
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Selection & Modal states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerProduct, setDrawerProduct] = useState<ProductDto | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductDto | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load suppliers and categories for filters
  const loadFilterOptions = useCallback(async () => {
    try {
      const sups = await localDb.suppliers.getSuppliers();
      setSuppliers(sups);
      const catSummaries = await localDb.products.getCategoriesSummary();
      const uniqueCats = Array.from(new Set(catSummaries.map((c) => c.nameUk))).filter(Boolean);
      setCategories(uniqueCats);
    } catch (e) {
      console.warn('[ProductsView:loadFilterOptions] Failed to load filter options:', e);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await localDb.products.getProducts({
        page,
        limit,
        search: search.trim() || undefined,
        supplierId: selectedSupplierId || undefined,
        category: selectedCategory || undefined,
        inStockOnly: inStockOnly || undefined,
      });

      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      console.warn('[ProductsView:fetchProducts] Failed to fetch products:', e);
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, selectedSupplierId, selectedCategory, inStockOnly]);

  // Initial load and reactive data sync
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useDataSync(['products', 'suppliers'], () => {
    fetchProducts();
    loadFilterOptions();
  });

  // Filter handlers
  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedSupplierId('');
    setSelectedCategory('');
    setInStockOnly(false);
    setPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () => Boolean(search || selectedSupplierId || selectedCategory || inStockOnly),
    [search, selectedSupplierId, selectedCategory, inStockOnly],
  );

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const isAllSelected = useMemo(
    () => products.length > 0 && products.every((p) => selectedIds.includes(p.id)),
    [products, selectedIds],
  );

  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      const currentPageIds = products.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  }, [isAllSelected, products]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Single delete
  const handleConfirmSingleDelete = useCallback(async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await localDb.products.bulkDeleteProducts({ productIds: [productToDelete.id] });
      setSelectedIds((prev) => prev.filter((id) => id !== productToDelete.id));
      setProductToDelete(null);
      await fetchProducts();
    } finally {
      setIsDeleting(false);
    }
  }, [productToDelete, fetchProducts]);

  // Bulk delete
  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await localDb.products.bulkDeleteProducts({ productIds: selectedIds });
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      await fetchProducts();
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, fetchProducts]);

  return (
    <div data-testid="products-view" className="space-y-4 animate-in fade-in duration-200">
      {/* Toolbar */}
      <ProductsToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        selectedSupplierId={selectedSupplierId}
        onSupplierChange={(val) => {
          setSelectedSupplierId(val);
          setPage(1);
        }}
        selectedCategory={selectedCategory}
        onCategoryChange={(val) => {
          setSelectedCategory(val);
          setPage(1);
        }}
        inStockOnly={inStockOnly}
        onInStockOnlyChange={(val) => {
          setInStockOnly(val);
          setPage(1);
        }}
        suppliers={suppliers}
        categories={categories}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={total}
      />

      {/* Bulk Actions Bar */}
      <ProductsBulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        isDeleting={isDeleting}
      />

      {/* Main Table */}
      <ProductsTable
        products={products}
        totalItems={total}
        currentPage={page}
        pageSize={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(sz) => {
          setLimit(sz);
          setPage(1);
        }}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        isAllSelected={isAllSelected}
        onViewDetails={setDrawerProduct}
        onDeleteProduct={setProductToDelete}
        isLoading={isLoading}
      />

      {/* Drawer */}
      <ProductDetailsDrawer
        product={drawerProduct}
        onClose={() => setDrawerProduct(null)}
        onProductUpdate={(updated) => {
          setDrawerProduct(updated);
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />

      {/* Single Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        title={t('catalogs:confirmDeleteProductTitle')}
        description={`${t('catalogs:confirmDeleteProductMessage')} (${productToDelete?.sku} — ${productToDelete?.titleUk})`}
        isLoading={isDeleting}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={t('catalogs:confirmDeleteBulkTitle')}
        description={t('catalogs:confirmDeleteBulkMessage', { count: selectedIds.length })}
        isLoading={isDeleting}
      />
    </div>
  );
};
