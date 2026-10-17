import React from 'react';
import { Loader2 } from 'lucide-react';
import { SuppliersKpiCards } from '@/modules/suppliers/components/list/SuppliersKpiCards';
import { SuppliersTableToolbar } from '@/modules/suppliers/components/list/SuppliersTableToolbar';
import { SuppliersDataTable } from '@/modules/suppliers/components/list/SuppliersDataTable';
import { SuppliersDialogsContainer } from '@/modules/suppliers/components/list/SuppliersDialogsContainer';
import { SuppliersEmptyState } from '@/modules/suppliers/components/list/SuppliersEmptyState';
import { TablePagination } from '@/components/ui/table-pagination';
import { QuotaExcessBanner } from '@/components/ui/QuotaExcessBanner';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/hooks/useLicense';
import { useQuotas } from '@/hooks/useQuotas';
import { useTranslation } from '@/i18n';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { SUPPLIER_COLUMNS } from '@/modules/suppliers/types';
import type { SupplierColumnId } from '@/modules/suppliers/types';
import { useSuppliersListPageState } from '@/modules/suppliers/hooks/useSuppliersListPageState';
import { useSuppliersFilterPagination } from '@/modules/suppliers/hooks/useSuppliersFilterPagination';
import { useSuppliersCrud } from '@/modules/suppliers/hooks/useSuppliersCrud';

export const SuppliersListPage: React.FC = () => {
  const { language } = useTranslation(['suppliers', 'common']);
  const { token, isAuthenticated } = useAuth();
  const { isExpired } = useLicense();
  const { quotas, updateLocalQuota, refreshQuotas, setLocalQuotaUsed, isSupplierLimitReached } =
    useQuotas();

  const {
    selectedSupplierForDrawer,
    setSelectedSupplierForDrawer,
    drawerInitialTab,
    feedWizardSupplierId,
    supplierToEdit,
    supplierToDelete,
    isCreateOpen,
    openDrawer,
    closeDrawer,
    openCreate,
    openEdit,
    closeCreateOrEdit,
    openDelete,
    closeDelete,
    openFeedWizard,
    closeFeedWizard,
  } = useSuppliersListPageState();

  const {
    suppliers,
    isLoading,
    fetchSuppliers,
    handleSaveSupplier,
    handleConfirmDelete,
    handleToggleStatus,
  } = useSuppliersCrud({
    token,
    isAuthenticated,
    selectedSupplierForDrawer,
    setSelectedSupplierForDrawer,
    supplierToEdit,
    supplierToDelete,
    closeCreateOrEdit,
    closeDelete,
    closeDrawer,
    updateLocalQuota,
    setLocalQuotaUsed,
    refreshQuotas,
  });

  const { isColumnVisible, toggleColumn, resetToDefaults, columnOptions } =
    useColumnVisibility<SupplierColumnId>('suppliers_v5', SUPPLIER_COLUMNS, language === 'uk');

  const {
    filters,
    handleFilterChange,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
  } = useSuppliersFilterPagination(suppliers);

  if (isExpired) return <ExpiredPlanBlocker />;

  const activeFeedsTotal = suppliers.reduce((acc, s) => acc + (s.activeFeedsCount || 0), 0);
  const productsTotal = suppliers.reduce((acc, s) => acc + (s.productsCount || 0), 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto" data-testid="suppliers-page">
      <QuotaExcessBanner quotas={quotas} onOpenReconciliation={() => {}} />

      <SuppliersKpiCards
        suppliersCount={suppliers.length}
        activeFeedsCount={activeFeedsTotal}
        totalProductsCount={productsTotal}
        activeRulesCount={suppliers.length * 2}
        quotas={quotas}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : suppliers.length === 0 ? (
        <SuppliersEmptyState
          isSupplierLimitReached={isSupplierLimitReached}
          onOpenCreate={openCreate}
        />
      ) : (
        <>
          <SuppliersTableToolbar
            filters={filters}
            pageSize={pageSize}
            isSupplierLimitReached={isSupplierLimitReached}
            onFilterChange={handleFilterChange}
            onPageSizeChange={setPageSize}
            onOpenCreate={openCreate}
            columnOptions={columnOptions}
            onToggleColumn={toggleColumn}
            onResetColumns={resetToDefaults}
            isUk={language === 'uk'}
            onExport={() => {
              const blob = new Blob([JSON.stringify(suppliers, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `smartfeed_suppliers_${Date.now()}.json`;
              a.click();
            }}
          />

          <div className="space-y-3">
            <SuppliersDataTable
              suppliers={paginatedItems}
              onOpenDetails={(s) => openDrawer(s, 'overview')}
              onOpenFeeds={(s) => openDrawer(s, 'feeds')}
              onEdit={openEdit}
              onDelete={(id) => {
                const sup = suppliers.find((s) => s.id === id);
                if (sup) openDelete(sup);
              }}
              onAddFeed={(s) => openFeedWizard(s.id)}
              onToggleStatus={handleToggleStatus}
              isColumnVisible={isColumnVisible}
            />

            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </>
      )}

      <SuppliersDialogsContainer
        suppliers={suppliers}
        selectedSupplierForDrawer={selectedSupplierForDrawer}
        drawerInitialTab={drawerInitialTab}
        feedWizardSupplierId={feedWizardSupplierId}
        supplierToEdit={supplierToEdit}
        supplierToDelete={supplierToDelete}
        isCreateOpen={isCreateOpen}
        onCloseDrawer={closeDrawer}
        onToggleStatus={handleToggleStatus}
        onEditSupplier={openEdit}
        onOpenDelete={openDelete}
        onRefreshSupplier={() => fetchSuppliers(true, true)}
        onConnectFeed={openFeedWizard}
        onCloseFeedWizard={closeFeedWizard}
        onFeedWizardSuccess={() => {
          closeFeedWizard();
          fetchSuppliers(true, true);
        }}
        onCloseCreateOrEdit={closeCreateOrEdit}
        onSaveSupplier={handleSaveSupplier}
        onCloseDelete={closeDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};
