import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Building2, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/hooks/useLicense';
import { useQuotas } from '@/hooks/useQuotas';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';
import { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { QuotaExcessBanner } from '@/components/ui/QuotaExcessBanner';
import { SuppliersModals } from '@/components/suppliers/SuppliersModals';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/api';
import { useDataSync, emitDataSync } from '@/lib/syncEvents';
import { SuppliersStatsHeader } from '@/components/suppliers/SuppliersStatsHeader';
import { SuppliersToolbar } from '@/components/suppliers/SuppliersToolbar';

export function SuppliersPage() {
  const { t, language } = useTranslation(['suppliers', 'common']);
  const isUk = language === 'uk';
  const { token, isAuthenticated } = useAuth();
  const { isExpired } = useLicense();
  const {
    quotas,
    updateLocalQuota,
    refreshQuotas,
    setLocalQuotaUsed,
    isSupplierLimitReached,
    isFeedLimitReached,
  } = useQuotas();

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [importWizardSupplierId, setImportWizardSupplierId] = useState<string | undefined>(
    undefined,
  );
  const [feedsModalSupplier, setFeedsModalSupplier] = useState<SupplierDto | null>(null);
  const [pricingRulesSupplier, setPricingRulesSupplier] = useState<SupplierDto | null>(null);
  const [isQuotaExceededOpen, setIsQuotaExceededOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDto | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierDto | null>(null);

  const lastFetchedTokenRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchSuppliers = useCallback(
    async (force = false, silent = false) => {
      if (!token || !isAuthenticated) return;
      if (!force && lastFetchedTokenRef.current === token) return;
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        if (!silent) setIsLoading(true);
        const data = await getSuppliers(token);
        lastFetchedTokenRef.current = token;
        setSuppliers(data);
        setLocalQuotaUsed('suppliers', data.length);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
      } finally {
        if (!silent) setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [token, isAuthenticated, setLocalQuotaUsed],
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Unified reactive sync subscription across feeds, products, and suppliers
  useDataSync(['suppliers', 'feeds', 'products', 'all'], () => {
    fetchSuppliers(true, true);
  });

  const handleOpenCreate = () => {
    if (isSupplierLimitReached) {
      setIsQuotaExceededOpen(true);
      return;
    }
    setSelectedSupplier(null);
    setIsCreateOpen(true);
  };

  const handleOpenImportWizard = (supplierId?: string) => {
    setImportWizardSupplierId(supplierId);
    setIsImportWizardOpen(true);
  };

  const handleSaveSupplier = async (dto: CreateSupplierDto) => {
    if (!token) return;

    if (selectedSupplier) {
      await updateSupplier(selectedSupplier.id, dto, token);
    } else {
      if (isSupplierLimitReached) {
        setIsQuotaExceededOpen(true);
        return;
      }
      await createSupplier(dto, token);
      updateLocalQuota('suppliers', 1);
    }

    emitDataSync(['suppliers', 'quotas']);
    await fetchSuppliers(true);
    setSelectedSupplier(null);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const target = suppliers.find((s) => s.id === supplierId);
    if (target) {
      setSupplierToDelete(target);
    }
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete || !token) return;
    const target = supplierToDelete;
    setSupplierToDelete(null);

    await deleteSupplier(target.id, token);
    updateLocalQuota('suppliers', -1);
    if (target.productsCount && target.productsCount > 0) {
      updateLocalQuota('products', -target.productsCount);
    }
    if (target.activeFeedsCount && target.activeFeedsCount > 0) {
      updateLocalQuota('feeds', -target.activeFeedsCount);
    }
    refreshQuotas();
    emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
    await fetchSuppliers(true);
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()),
    );
  }, [suppliers, search]);

  const { currentPage, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize } =
    usePagination<SupplierDto>(filteredSuppliers, {
      initialPageSize: 10,
      resetDeps: [search],
    });

  if (isExpired) {
    return <ExpiredPlanBlocker />;
  }

  return (
    <div className="p-6 space-y-6" data-testid="suppliers-page">
      {/* Excess Data Alert Banner (Downgrade Reconciliation) */}
      <QuotaExcessBanner
        quotas={quotas}
        onOpenReconciliation={() => setIsReconciliationOpen(true)}
      />

      {/* KPI Stats & Title */}
      <SuppliersStatsHeader quotas={quotas} suppliersCount={suppliers.length} />

      {/* Search & Actions Toolbar (Only show when suppliers exist or search is active) */}
      {(suppliers.length > 0 || search) && (
        <SuppliersToolbar
          search={search}
          isSupplierLimitReached={isSupplierLimitReached}
          isFeedLimitReached={isFeedLimitReached}
          onSearchChange={setSearch}
          onOpenCreate={handleOpenCreate}
          onOpenImportWizard={() => handleOpenImportWizard()}
        />
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-card/40">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {search
                ? t('suppliers:noSearchResults', { defaultValue: 'Постачальників не знайдено' })
                : t('suppliers:emptyListTitle', { defaultValue: 'Список постачальників порожній' })}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {search
                ? t('suppliers:noSearchDesc', {
                    defaultValue: 'Спробуйте змінити пошуковий запит або очистити фільтри',
                  })
                : t('suppliers:emptyListDesc', {
                    defaultValue:
                      'Додайте свого першого постачальника товарів та підключіть XML/CSV фід для автоматичного імпорту каталогу',
                  })}
            </p>
            {!search && (
              <Button
                onClick={handleOpenCreate}
                disabled={isSupplierLimitReached}
                className="mt-2 text-xs h-9 gap-1.5"
                data-testid="empty-create-supplier-btn"
              >
                <Plus className="h-4 w-4" />
                {t('suppliers:createSupplier', { defaultValue: 'Додати постачальника' })}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedItems.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                isFeedLimitReached={isFeedLimitReached}
                onEdit={(s: SupplierDto) => {
                  setSelectedSupplier(s);
                  setIsCreateOpen(true);
                }}
                onDelete={handleDeleteSupplier}
                onImportFeed={(s: SupplierDto) => handleOpenImportWizard(s.id)}
                onViewFeeds={(s: SupplierDto) => setFeedsModalSupplier(s)}
                onPricingRules={(s: SupplierDto) => setPricingRulesSupplier(s)}
              />
            ))}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Modals & Dialogs */}
      <SuppliersModals
        isCreateOpen={isCreateOpen}
        selectedSupplier={selectedSupplier}
        onCloseCreate={() => {
          setIsCreateOpen(false);
          setSelectedSupplier(null);
        }}
        onSaveSupplier={handleSaveSupplier}
        isImportWizardOpen={isImportWizardOpen}
        importWizardSupplierId={importWizardSupplierId}
        suppliers={suppliers}
        onCloseImportWizard={() => {
          setIsImportWizardOpen(false);
          setImportWizardSupplierId(undefined);
        }}
        feedsModalSupplier={feedsModalSupplier}
        onCloseFeedsModal={() => setFeedsModalSupplier(null)}
        onConnectNewFeed={(id) => handleOpenImportWizard(id)}
        pricingRulesSupplier={pricingRulesSupplier}
        onClosePricingRules={() => setPricingRulesSupplier(null)}
        isQuotaExceededOpen={isQuotaExceededOpen}
        onCloseQuotaExceeded={() => setIsQuotaExceededOpen(false)}
        isUk={isUk}
        quotasSuppliersUsed={quotas?.suppliers?.used}
        quotasSuppliersMax={quotas?.suppliers?.max}
        currentPlanName={isUk ? quotas?.planNameUk || 'Старт' : quotas?.planNameEn || 'Starter'}
        isReconciliationOpen={isReconciliationOpen}
        onCloseReconciliation={() => setIsReconciliationOpen(false)}
        supplierToDelete={supplierToDelete}
        onCloseDeleteDialog={() => setSupplierToDelete(null)}
        onConfirmDeleteSupplier={handleConfirmDeleteSupplier}
      />
    </div>
  );
}
