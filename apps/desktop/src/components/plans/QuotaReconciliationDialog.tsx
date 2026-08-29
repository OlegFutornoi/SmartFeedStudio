import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  FolderTree,
  Radio,
  Building2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
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
import { useNavigate } from 'react-router-dom';
import { QuotaCategoriesTab } from './QuotaCategoriesTab';
import { QuotaFeedsTab } from './QuotaFeedsTab';
import { QuotaSuppliersTab } from './QuotaSuppliersTab';
import { useDataSync } from '@/lib/syncEvents';

interface QuotaReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'CATEGORIES' | 'FEEDS' | 'SUPPLIERS';

export const QuotaReconciliationDialog: React.FC<QuotaReconciliationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, language } = useTranslation(['suppliers', 'plans', 'common']);
  const isUk = language === 'uk';
  const navigate = useNavigate();
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

  if (!isOpen) return null;

  const currentPlanName = isUk ? quotas?.planNameUk || 'Старт' : quotas?.planNameEn || 'Starter';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
      data-testid="quota-reconciliation-dialog"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 100% Solid Opaque Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                {isUk ? 'Узгодження лімітів тарифного плану' : 'Plan Limits Reconciliation'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isUk
                  ? `Поточний тариф «${currentPlanName}»: оберіть що видалити або підвищіть тариф`
                  : `Current plan «${currentPlanName}»: choose what to remove or upgrade`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-reconciliation-dialog-btn"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t('common:close', { defaultValue: 'Закрити' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Quota Status Bar */}
        <div className="px-6 py-3 bg-muted/40 border-b border-border/60 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-xl border border-border/60 bg-card">
              <span className="text-muted-foreground block text-[11px]">
                {isUk ? 'Товарів у базі' : 'Products in DB'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 font-bold font-mono">
                <span
                  className={
                    currentProductsUsed > maxProductsLimit ? 'text-destructive' : 'text-foreground'
                  }
                >
                  {currentProductsUsed.toLocaleString()}
                </span>
                <span className="text-muted-foreground font-normal text-[10px]">
                  / {maxProductsLimit.toLocaleString()} SKU
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border/60 bg-card">
              <span className="text-muted-foreground block text-[11px]">
                {isUk ? 'Підключені фіди' : 'Connected Feeds'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 font-bold font-mono">
                <span
                  className={
                    currentFeedsUsed > maxFeedsLimit ? 'text-destructive' : 'text-foreground'
                  }
                >
                  {currentFeedsUsed}
                </span>
                <span className="text-muted-foreground font-normal text-[10px]">
                  / {maxFeedsLimit}
                </span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-border/60 bg-card flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  {isUk ? 'Стан тарифу' : 'Status'}
                </span>
                <span
                  className={`text-xs font-semibold ${isProjectedValid ? 'text-emerald-500' : 'text-destructive'}`}
                >
                  {isProjectedValid
                    ? isUk
                      ? 'В нормі'
                      : 'Compliant'
                    : isUk
                      ? 'Перевищено'
                      : 'Exceeded'}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2"
                onClick={() => {
                  onClose();
                  navigate('/plans');
                }}
              >
                <Sparkles className="h-3 w-3" />
                <span>{isUk ? 'Апгрейд' : 'Upgrade'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-border bg-muted/20 px-6 shrink-0 gap-2 pt-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'CATEGORIES'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('CATEGORIES')}
            data-testid="tab-categories-reconciliation"
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>{isUk ? 'Категорії товарів' : 'Product Categories'}</span>
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 font-mono">
              {categories.length}
            </Badge>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'FEEDS'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('FEEDS')}
            data-testid="tab-feeds-reconciliation"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{isUk ? 'Фіди джерел' : 'Feeds'}</span>
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 font-mono">
              {feedSources.length}
            </Badge>
          </button>

          <button
            type="button"
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'SUPPLIERS'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('SUPPLIERS')}
            data-testid="tab-suppliers-reconciliation"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{isUk ? 'Постачальники' : 'Suppliers'}</span>
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 font-mono">
              {suppliers.length}
            </Badge>
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                {isUk ? 'Завантаження структури каталогу...' : 'Loading catalog structure...'}
              </p>
            </div>
          ) : activeTab === 'CATEGORIES' ? (
            <QuotaCategoriesTab
              categories={categories}
              filteredCategories={filteredCategories}
              selectedCategoryIds={selectedCategoryIds}
              deletingIds={deletingIds}
              categorySearch={categorySearch}
              isBulkDeleting={isBulkDeleting}
              isUk={isUk}
              currentProductsUsed={currentProductsUsed}
              maxProductsLimit={maxProductsLimit}
              selectedProductsToDeleteCount={selectedProductsToDeleteCount}
              projectedRemainingProducts={projectedRemainingProducts}
              isProjectedValid={isProjectedValid}
              onSearchChange={setCategorySearch}
              onToggleCategory={handleToggleCategory}
              onSelectAll={handleSelectAllCategories}
              onDeselectAll={handleDeselectAllCategories}
              onDeleteSelected={handleDeleteSelectedCategories}
              onDeleteSingleCategory={handleDeleteSingleCategory}
            />
          ) : activeTab === 'FEEDS' ? (
            <QuotaFeedsTab
              feedSources={feedSources}
              deletingIds={deletingIds}
              isUk={isUk}
              onDeleteFeed={handleDeleteFeedWithProducts}
            />
          ) : (
            <QuotaSuppliersTab
              suppliers={suppliers}
              deletingIds={deletingIds}
              isUk={isUk}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}
        </div>

        {/* 100% Solid Footer with Upgrade and Close CTA */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card z-10 shrink-0">
          <Button type="button" variant="outline" className="text-xs h-9" onClick={onClose}>
            {isUk ? 'Закрити' : 'Close'}
          </Button>

          <Button
            type="button"
            variant="default"
            className="gap-2 text-xs h-9 bg-primary shadow-sm"
            onClick={() => {
              onClose();
              navigate('/plans');
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {isUk ? 'Залишити всі дані та підвищити тариф' : 'Keep all data & upgrade plan'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
