import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotas } from '@/contexts/QuotasContext';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import {
  getCategoriesSummary,
  bulkDeleteProducts,
  getSupplierFeedSources,
  deleteSupplierFeedSource,
  getSuppliers,
  deleteSupplier,
  FeedSourceItemDto,
} from '@/lib/api';
import type { ProductCategorySummaryDto, SupplierDto } from '@smartfeed/shared';
import { useDataSync } from '@/lib/syncEvents';

export type TabType = 'CATEGORIES' | 'FEEDS' | 'SUPPLIERS';

export function useQuotaReconciliation(isOpen: boolean, isUk: boolean) {
  const { token } = useAuth();
  const { quotas, refreshQuotas } = useQuotas();
  const { runBackgroundTask } = useBackgroundJobs();

  const [activeTab, setActiveTab] = useState<TabType>('CATEGORIES');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data states
  const [categories, setCategories] = useState<ProductCategorySummaryDto[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>('');

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [feedSources, setFeedSources] = useState<
    { supplier: SupplierDto; feed: FeedSourceItemDto }[]
  >([]);

  const loadReconciliationData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [catsData, suppsData] = await Promise.all([
        getCategoriesSummary(token),
        getSuppliers(token),
      ]);
      setCategories(catsData || []);
      setSuppliers(suppsData || []);

      const allFeeds: { supplier: SupplierDto; feed: FeedSourceItemDto }[] = [];
      await Promise.all(
        (suppsData || []).map(async (sup) => {
          const feeds = await getSupplierFeedSources(sup.id, token);
          feeds.forEach((f) => allFeeds.push({ supplier: sup, feed: f }));
        }),
      );
      setFeedSources(allFeeds);
    } catch (err: unknown) {
      console.error('Failed to load reconciliation data:', err);
      setErrorMessage(
        isUk ? 'Не вдалося завантажити дані для узгодження' : 'Failed to load reconciliation data',
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, isUk]);

  useEffect(() => {
    if (isOpen) {
      loadReconciliationData();
      setSelectedCategoryIds([]);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, loadReconciliationData]);

  // Unified reactive sync subscription
  useDataSync(['suppliers', 'feeds', 'products', 'quotas'], () => {
    if (isOpen) {
      loadReconciliationData();
    }
  });

  // Quotas calculations
  const currentProductsUsed = quotas?.products?.used || 0;
  const maxProductsLimit = quotas?.products?.max || 1000;
  const currentFeedsUsed = quotas?.feeds?.used || 0;
  const maxFeedsLimit = quotas?.feeds?.max || 1;

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.nameUk.toLowerCase().includes(q) ||
        (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
        (c.supplierName && c.supplierName.toLowerCase().includes(q)),
    );
  }, [categories, categorySearch]);

  const selectedProductsToDeleteCount = useMemo(() => {
    return categories
      .filter((c) => selectedCategoryIds.includes(c.id))
      .reduce((acc, c) => acc + c.productCount, 0);
  }, [categories, selectedCategoryIds]);

  const projectedRemainingProducts = Math.max(
    0,
    currentProductsUsed - selectedProductsToDeleteCount,
  );
  const isProjectedValid = projectedRemainingProducts <= maxProductsLimit;

  const handleToggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategoryIds(filteredCategories.map((c) => c.id));
  };

  const handleDeselectAllCategories = () => {
    setSelectedCategoryIds([]);
  };

  const handleDeleteSelectedCategories = async () => {
    if (!token || selectedCategoryIds.length === 0) return;
    setIsBulkDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const idsToDelete = [...selectedCategoryIds];
    const skuCount = selectedProductsToDeleteCount;

    try {
      await runBackgroundTask({
        kind: 'DELETE_CATEGORIES',
        title: isUk
          ? `Видалення обраних категорій (${skuCount.toLocaleString()} SKU)`
          : `Deleting selected categories (${skuCount.toLocaleString()} SKU)`,
        subtitle: isUk ? 'Очищення товарів у фоні' : 'Cleaning up products in background',
        totalItems: skuCount,
        action: async () => {
          const result = await bulkDeleteProducts(token, {
            categoryIds: idsToDelete,
          });
          setSuccessMessage(
            isUk
              ? `Успішно видалено ${result.deletedCount.toLocaleString()} SKU товарів. Залишок: ${result.remainingCount.toLocaleString()} SKU.`
              : `Successfully deleted ${result.deletedCount.toLocaleString()} SKUs. Remaining: ${result.remainingCount.toLocaleString()} SKU.`,
          );
          await refreshQuotas(true);
          await loadReconciliationData();
          setSelectedCategoryIds([]);
          return result;
        },
      });
    } catch (err: unknown) {
      console.error('Failed to bulk delete products:', err);
      setErrorMessage(
        isUk ? 'Помилка при видаленні товарів' : 'Failed to delete selected products',
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteSingleCategory = async (cat: ProductCategorySummaryDto) => {
    if (!token) return;
    setDeletingIds((prev) => new Set(prev).add(cat.id));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await runBackgroundTask({
        kind: 'DELETE_CATEGORIES',
        title: isUk
          ? `Видалення категорії «${cat.nameUk}» (${cat.productCount} SKU)`
          : `Deleting category «${cat.nameEn || cat.nameUk}» (${cat.productCount} SKU)`,
        subtitle: isUk ? 'Очищення каталогу у фоні' : 'Catalog cleanup in background',
        totalItems: cat.productCount,
        action: async () => {
          const result = await bulkDeleteProducts(token, {
            categoryIds: [cat.id],
          });
          setSuccessMessage(
            isUk
              ? `Успішно видалено категорію (${result.deletedCount.toLocaleString()} SKU).`
              : `Successfully deleted category (${result.deletedCount.toLocaleString()} SKU).`,
          );
          await refreshQuotas(true);
          await loadReconciliationData();
          setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.id));
          return result;
        },
      });
    } catch (err: unknown) {
      console.error('Failed to delete category:', err);
      setErrorMessage(isUk ? 'Помилка при видаленні категорії' : 'Failed to delete category');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(cat.id);
        return next;
      });
    }
  };

  const handleDeleteFeedWithProducts = async (supplierId: string, feed: FeedSourceItemDto) => {
    if (!token) return;
    setDeletingIds((prev) => new Set(prev).add(feed.id));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await runBackgroundTask({
        kind: 'DELETE_FEED',
        title: isUk ? `Видалення фіду «${feed.name}»` : `Deleting feed «${feed.name}»`,
        subtitle: isUk
          ? 'Видалення фіду та його товарів у фоні'
          : 'Deleting feed and products in background',
        action: async () => {
          const res = await deleteSupplierFeedSource(supplierId, feed.id, token, true);
          setSuccessMessage(
            isUk
              ? `Фід успішно видалено разом із ${res.deletedProductsCount || 0} товарами.`
              : `Feed deleted with ${res.deletedProductsCount || 0} products.`,
          );
          await refreshQuotas(true);
          await loadReconciliationData();
          return res;
        },
      });
    } catch (err: unknown) {
      console.error('Failed to delete feed with products:', err);
      setErrorMessage(isUk ? 'Помилка при видаленні фіду' : 'Failed to delete feed');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(feed.id);
        return next;
      });
    }
  };

  const handleDeleteSupplier = async (sup: SupplierDto) => {
    if (!token) return;
    setDeletingIds((prev) => new Set(prev).add(sup.id));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await runBackgroundTask({
        kind: 'DELETE_SUPPLIER',
        title: isUk ? `Видалення постачальника «${sup.name}»` : `Deleting supplier «${sup.name}»`,
        subtitle: isUk
          ? 'Видалення постачальника та всіх товарів у фоні'
          : 'Deleting supplier and products in background',
        action: async () => {
          const res = await deleteSupplier(sup.id, token);
          setSuccessMessage(
            isUk ? 'Постачальника та всі його товари видалено' : 'Supplier and products deleted',
          );
          await refreshQuotas(true);
          await loadReconciliationData();
          return res;
        },
      });
    } catch (err: unknown) {
      console.error('Failed to delete supplier:', err);
      setErrorMessage(isUk ? 'Помилка при видаленні постачальника' : 'Failed to delete supplier');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(sup.id);
        return next;
      });
    }
  };

  return {
    quotas,
    activeTab,
    setActiveTab,
    isLoading,
    deletingIds,
    isBulkDeleting,
    successMessage,
    errorMessage,
    categories,
    selectedCategoryIds,
    categorySearch,
    setCategorySearch,
    suppliers,
    feedSources,
    filteredCategories,
    selectedProductsToDeleteCount,
    projectedRemainingProducts,
    isProjectedValid,
    currentProductsUsed,
    maxProductsLimit,
    currentFeedsUsed,
    maxFeedsLimit,
    handleToggleCategory,
    handleSelectAllCategories,
    handleDeselectAllCategories,
    handleDeleteSelectedCategories,
    handleDeleteSingleCategory,
    handleDeleteFeedWithProducts,
    handleDeleteSupplier,
  };
}
