import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, FolderTree, Radio, Building2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { QuotaCategoriesTab } from './QuotaCategoriesTab';
import { QuotaFeedsTab } from './QuotaFeedsTab';
import { QuotaSuppliersTab } from './QuotaSuppliersTab';
import { QuotaReconciliationHeader } from './QuotaReconciliationHeader';
import { QuotaReconciliationFooter } from './QuotaReconciliationFooter';
import { useQuotaReconciliation } from '@/hooks/useQuotaReconciliation';

interface QuotaReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaReconciliationDialog: React.FC<QuotaReconciliationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useTranslation(['suppliers', 'plans', 'common']);
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
        <QuotaReconciliationHeader
          currentPlanName={currentPlanName}
          isUk={isUk}
          currentProductsUsed={currentProductsUsed}
          maxProductsLimit={maxProductsLimit}
          currentFeedsUsed={currentFeedsUsed}
          maxFeedsLimit={maxFeedsLimit}
          onClose={onClose}
          onNavigatePlans={() => {
            onClose();
            navigate('/plans');
          }}
        />

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
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-muted border border-border text-foreground text-xs flex items-center gap-2">
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

        <QuotaReconciliationFooter
          activeTab={activeTab}
          selectedCategoryIds={selectedCategoryIds}
          isUk={isUk}
          projectedRemainingProducts={projectedRemainingProducts}
          isProjectedValid={isProjectedValid}
          isBulkDeleting={isBulkDeleting}
          selectedProductsToDeleteCount={selectedProductsToDeleteCount}
          onClose={onClose}
          onDeleteSelected={handleDeleteSelectedCategories}
        />
      </div>
    </div>,
    document.body,
  );
};
