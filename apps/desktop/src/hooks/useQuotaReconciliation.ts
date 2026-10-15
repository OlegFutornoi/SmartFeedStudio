import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotas } from '@/contexts/QuotasContext';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import {
  getCategoriesSummary,
  getSupplierFeedSources,
  getSuppliers,
  FeedSourceItemDto,
} from '@/lib/api';
import type { ProductCategorySummaryDto, SupplierDto } from '@smartfeed/shared';
import { useDataSync } from '@/lib/syncEvents';
import {
  buildQuotaState,
  filterCategories,
  computeSelectedProductsCount,
  computeProjectedRemaining,
} from '@/hooks/reconciliationCalculator';
import { useReconciliationDeletions } from '@/hooks/useReconciliationDeletions';

export type TabType = 'CATEGORIES' | 'FEEDS' | 'SUPPLIERS';

export function useQuotaReconciliation(isOpen: boolean, isUk: boolean) {
  const { token } = useAuth();
  const { quotas, refreshQuotas } = useQuotas();
  const { runBackgroundTask } = useBackgroundJobs();

  const [activeTab, setActiveTab] = useState<TabType>('CATEGORIES');
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
  const { currentProductsUsed, maxProductsLimit, currentFeedsUsed, maxFeedsLimit } =
    buildQuotaState(quotas);

  const filteredCategories = useMemo(
    () => filterCategories(categories, categorySearch),
    [categories, categorySearch],
  );

  const selectedProductsToDeleteCount = useMemo(
    () => computeSelectedProductsCount(categories, selectedCategoryIds),
    [categories, selectedCategoryIds],
  );

  const projectedRemainingProducts = computeProjectedRemaining(
    currentProductsUsed,
    selectedProductsToDeleteCount,
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

  const {
    deletingIds,
    isBulkDeleting,
    handleDeleteSelectedCategories,
    handleDeleteSingleCategory,
    handleDeleteFeedWithProducts,
    handleDeleteSupplier,
  } = useReconciliationDeletions({
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
  });

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
