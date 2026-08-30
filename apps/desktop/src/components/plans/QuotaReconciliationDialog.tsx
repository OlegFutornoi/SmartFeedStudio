import React from 'react';
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
import { useNavigate } from 'react-router-dom';
import { QuotaCategoriesTab } from './QuotaCategoriesTab';
import { QuotaFeedsTab } from './QuotaFeedsTab';
import { QuotaSuppliersTab } from './QuotaSuppliersTab';
import { useQuotaReconciliation } from '@/hooks/useQuotaReconciliation';

interface QuotaReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaReconciliationDialog: React.FC<QuotaReconciliationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, language } = useTranslation(['suppliers', 'plans', 'common']);
  const isUk = language === 'uk';
  const navigate = useNavigate();

  const {
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
  } = useQuotaReconciliation(isOpen, isUk);

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
                  {isUk ? 'Альтернатива' : 'Alternative'}
                </span>
                <span className="font-semibold text-xs text-primary block mt-0.5">PRO Тариф</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1 rounded-lg"
                onClick={() => {
                  onClose();
                  navigate('/plans');
                }}
              >
                <Sparkles className="h-3 w-3" />
                {isUk ? 'Апгрейд' : 'Upgrade'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border/60 shrink-0 bg-card">
          <button
            type="button"
            data-testid="tab-categories-reconciliation"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'CATEGORIES'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            {isUk ? 'Категорії товарів' : 'Product Categories'}
            <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
              {categories.length}
            </Badge>
          </button>

          <button
            type="button"
            data-testid="tab-feeds-reconciliation"
            onClick={() => setActiveTab('FEEDS')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'FEEDS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            {isUk ? 'Джерела фідів' : 'Feed Sources'}
            <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
              {feedSources.length}
            </Badge>
          </button>

          <button
            type="button"
            data-testid="tab-suppliers-reconciliation"
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'SUPPLIERS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            {isUk ? 'Постачальники' : 'Suppliers'}
            <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
              {suppliers.length}
            </Badge>
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">{isUk ? 'Завантаження даних...' : 'Loading data...'}</span>
            </div>
          ) : (
            <>
              {activeTab === 'CATEGORIES' && (
                <QuotaCategoriesTab
                  categories={categories}
                  filteredCategories={filteredCategories}
                  selectedCategoryIds={selectedCategoryIds}
                  categorySearch={categorySearch}
                  deletingIds={deletingIds}
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
              )}

              {activeTab === 'FEEDS' && (
                <QuotaFeedsTab
                  feedSources={feedSources}
                  deletingIds={deletingIds}
                  isUk={isUk}
                  onDeleteFeed={handleDeleteFeedWithProducts}
                />
              )}

              {activeTab === 'SUPPLIERS' && (
                <QuotaSuppliersTab
                  suppliers={suppliers}
                  deletingIds={deletingIds}
                  isUk={isUk}
                  onDeleteSupplier={handleDeleteSupplier}
                />
              )}
            </>
          )}
        </div>

        {/* 100% Solid Opaque Sticky Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card z-10 shrink-0">
          {activeTab === 'CATEGORIES' && selectedCategoryIds.length > 0 ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{isUk ? 'Після видалення:' : 'After:'}</span>
              <span
                className={`font-mono font-bold ${
                  isProjectedValid ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {projectedRemainingProducts.toLocaleString()} SKU
              </span>
              {isProjectedValid && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                >
                  {isUk ? 'В межах ліміту' : 'Within limit'}
                </Badge>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              {isUk ? 'Узгодьте дані для розблокування' : 'Reconcile data to unlock'}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl h-9 text-xs"
            >
              {isUk ? 'Закрити' : 'Close'}
            </Button>

            {activeTab === 'CATEGORIES' && selectedCategoryIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                data-testid="bulk-delete-categories-btn"
                disabled={isBulkDeleting}
                onClick={handleDeleteSelectedCategories}
                className="rounded-xl h-9 text-xs gap-1.5 font-semibold"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                {isUk
                  ? `Видалити ${selectedCategoryIds.length} категорій (-${selectedProductsToDeleteCount.toLocaleString()} SKU)`
                  : `Delete ${selectedCategoryIds.length} categories (-${selectedProductsToDeleteCount.toLocaleString()} SKU)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
