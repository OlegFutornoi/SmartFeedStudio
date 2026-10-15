import { useState } from 'react';
import {
  bulkDeleteProducts,
  deleteSupplierFeedSource,
  deleteSupplier,
  FeedSourceItemDto,
} from '@/lib/api';
import type { ProductCategorySummaryDto, SupplierDto } from '@smartfeed/shared';
import type { BackgroundJobKind } from '@/contexts/BackgroundJobsContext';

interface UseReconciliationDeletionsParams {
  token: string | null;
  isUk: boolean;
  selectedCategoryIds: string[];
  selectedProductsToDeleteCount: number;
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<string[]>>;
  setFeedSources: React.Dispatch<
    React.SetStateAction<{ supplier: SupplierDto; feed: FeedSourceItemDto }[]>
  >;
  refreshQuotas: (force?: boolean) => Promise<unknown>;
  loadReconciliationData: () => Promise<void>;
  runBackgroundTask: (task: {
    kind: BackgroundJobKind;
    title: string;
    subtitle?: string;
    totalItems?: number;
    action: () => Promise<unknown>;
  }) => Promise<unknown>;
  setSuccessMessage: (msg: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
}

export function useReconciliationDeletions({
  token,
  isUk,
  selectedCategoryIds,
  selectedProductsToDeleteCount,
  setSelectedCategoryIds,
  setFeedSources,
  refreshQuotas,
  loadReconciliationData,
  runBackgroundTask,
  setSuccessMessage,
  setErrorMessage,
}: UseReconciliationDeletionsParams) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

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
          setFeedSources((prev) => prev.filter((item) => item.feed.id !== feed.id));
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
    deletingIds,
    isBulkDeleting,
    handleDeleteSelectedCategories,
    handleDeleteSingleCategory,
    handleDeleteFeedWithProducts,
    handleDeleteSupplier,
  };
}
