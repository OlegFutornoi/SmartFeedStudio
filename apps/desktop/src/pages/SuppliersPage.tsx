import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Building2, Plus, Search, Radio, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
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
import { CreateSupplierDialog } from '@/components/suppliers/CreateSupplierDialog';
import { ImportFeedWizardDialog } from '@/components/feeds/ImportFeedWizardDialog';
import { SupplierFeedsModal } from '@/components/suppliers/SupplierFeedsModal';
import { QuotaMetricCard } from '@/components/ui/QuotaMetricCard';
import { QuotaExceededDialog } from '@/components/ui/QuotaExceededDialog';
import { QuotaExcessBanner } from '@/components/ui/QuotaExcessBanner';
import { QuotaReconciliationDialog } from '@/components/plans/QuotaReconciliationDialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/api';
import { useDataSync, emitDataSync } from '@/lib/syncEvents';

export function SuppliersPage() {
  const { t, language } = useTranslation(['suppliers', 'common']);
  const isUk = language === 'uk';
  const { token, isAuthenticated } = useAuth();
  const { isExpired } = useLicense();
  const {
    quotas,
    updateLocalQuota,
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
      // Instant optimistic local update (0 ms)
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
    // Instant optimistic local update (0 ms)
    updateLocalQuota('suppliers', -1);
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
    usePagination(filteredSuppliers, {
      initialPageSize: 9,
      resetDeps: [search],
    });

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={t('suppliers:title')} />;
  }

  return (
    <div
      data-testid="suppliers-page"
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('suppliers:title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('suppliers:description')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-xs h-9 bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleOpenImportWizard()}
            disabled={isFeedLimitReached}
            title={
              isFeedLimitReached
                ? t('suppliers:feedLimitReachedTooltip', {
                    defaultValue:
                      'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
                  })
                : undefined
            }
            data-testid="import-feed-header-btn"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{t('suppliers:importFeedBtn', { defaultValue: 'Імпортувати фід' })}</span>
          </Button>

          <Button
            className="gap-2 text-xs h-9 shadow-md shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleOpenCreate}
            disabled={isSupplierLimitReached}
            title={
              isSupplierLimitReached
                ? t('suppliers:supplierLimitReachedTooltip', {
                    defaultValue:
                      'Ліміт постачальників вичерпано. Підвищіть тариф або видаліть зайвих постачальників.',
                  })
                : undefined
            }
            data-testid="add-supplier-header-btn"
          >
            <Plus className="h-4 w-4" />
            <span>{t('suppliers:addSupplier')}</span>
          </Button>
        </div>
      </div>

      {/* Quota Excess Reconciliation Banner (Downgrade Warning) */}
      <QuotaExcessBanner
        quotas={quotas}
        onOpenReconciliation={() => setIsReconciliationOpen(true)}
      />

      {/* Unified Real-time Quota Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuotaMetricCard
          title={t('suppliers:totalSuppliers')}
          icon={Building2}
          quota={quotas?.suppliers}
          unit={isUk ? 'постач.' : 'supp.'}
          testId="suppliers-quota-card"
        />

        <QuotaMetricCard
          title={t('suppliers:totalProducts')}
          icon={ShoppingBag}
          quota={quotas?.products}
          unit="SKU"
          testId="products-quota-card"
        />

        <QuotaMetricCard
          title={t('suppliers:activeFeeds')}
          icon={Radio}
          quota={quotas?.feeds}
          unit={isUk ? 'фідів' : 'feeds'}
          testId="feeds-quota-card"
        />
      </div>

      {/* Search & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('suppliers:searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/40 border border-border/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <Card className="p-12 text-center border-border/60 bg-card/40">
            <Building2 className="size-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">{t('suppliers:noSuppliers')}</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {t('suppliers:noSuppliersDesc')}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                isFeedLimitReached={isFeedLimitReached}
                onEdit={(sup) => {
                  setSelectedSupplier(sup);
                  setIsCreateOpen(true);
                }}
                onDelete={handleDeleteSupplier}
                onImportFeed={(sup) => handleOpenImportWizard(sup.id)}
                onViewFeeds={(sup) => setFeedsModalSupplier(sup)}
              />
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 9, 18, 36]}
            isUk={isUk}
            testIdPrefix="suppliers-pagination"
          />
        )}
      </div>

      {/* Modal for Create/Edit Supplier */}
      <CreateSupplierDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedSupplier(null);
        }}
        onSave={handleSaveSupplier}
        initialData={selectedSupplier}
      />

      {/* Modal for Connected Feed Sources Management */}
      <SupplierFeedsModal
        isOpen={!!feedsModalSupplier}
        onClose={() => setFeedsModalSupplier(null)}
        supplier={feedsModalSupplier}
        onConnectNewFeed={(sup) => {
          setFeedsModalSupplier(null);
          handleOpenImportWizard(sup.id);
        }}
      />

      {/* Modal for Import Feed Wizard */}
      <ImportFeedWizardDialog
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        suppliers={suppliers}
        initialSupplierId={importWizardSupplierId}
        onSuccess={() => {
          fetchSuppliers(true);
        }}
      />

      {/* Quota Exceeded Blocker Modal */}
      <QuotaExceededDialog
        isOpen={isQuotaExceededOpen}
        onClose={() => setIsQuotaExceededOpen(false)}
        resourceName={t('suppliers:title')}
        currentCount={quotas?.suppliers?.used || suppliers.length}
        maxLimit={quotas?.suppliers?.max || 1}
        planName={isUk ? quotas?.planNameUk : quotas?.planNameEn}
      />

      {/* Quota Reconciliation / Downgrade Excess Modal */}
      <QuotaReconciliationDialog
        isOpen={isReconciliationOpen}
        onClose={() => {
          setIsReconciliationOpen(false);
          fetchSuppliers(true);
        }}
      />

      {/* Styled Confirmation Dialog for Supplier Delete */}
      <ConfirmDeleteDialog
        isOpen={Boolean(supplierToDelete)}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleConfirmDeleteSupplier}
        title={isUk ? 'Видалити постачальника' : 'Delete Supplier'}
        description={
          <div className="space-y-2">
            <p>
              {isUk
                ? 'Ви дійсно бажаєте видалити цього постачальника?'
                : 'Are you sure you want to delete this supplier?'}
            </p>
            {supplierToDelete && (
              <div className="p-2.5 rounded-lg bg-muted border border-border font-mono text-[11px] text-foreground font-semibold truncate">
                {supplierToDelete.name} ({supplierToDelete.code})
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {isUk
                ? 'Всі підключені джерела фідів та товари цього постачальника також буде видалено.'
                : 'All connected feed sources and products of this supplier will also be deleted.'}
            </p>
          </div>
        }
        confirmLabel={isUk ? 'Видалити постачальника' : 'Delete supplier'}
        cancelLabel={isUk ? 'Скасувати' : 'Cancel'}
      />
    </div>
  );
}
