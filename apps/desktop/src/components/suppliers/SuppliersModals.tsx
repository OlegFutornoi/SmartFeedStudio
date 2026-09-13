import React from 'react';
import type { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { CreateSupplierDialog } from '@/components/suppliers/CreateSupplierDialog';
import { ImportFeedWizardDialog } from '@/components/feeds/ImportFeedWizardDialog';
import { SupplierFeedsModal } from '@/components/suppliers/SupplierFeedsModal';
import { SupplierPricingRulesModal } from '@/components/suppliers/SupplierPricingRulesModal';
import { QuotaExceededDialog } from '@/components/ui/QuotaExceededDialog';
import { QuotaReconciliationDialog } from '@/components/plans/QuotaReconciliationDialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

interface SuppliersModalsProps {
  isCreateOpen: boolean;
  selectedSupplier: SupplierDto | null;
  onCloseCreate: () => void;
  onSaveSupplier: (dto: CreateSupplierDto) => Promise<void>;

  isImportWizardOpen: boolean;
  importWizardSupplierId?: string;
  suppliers: SupplierDto[];
  onCloseImportWizard: () => void;

  feedsModalSupplier: SupplierDto | null;
  onCloseFeedsModal: () => void;
  onConnectNewFeed: (supplierId: string) => void;

  pricingRulesSupplier: SupplierDto | null;
  onClosePricingRules: () => void;

  isQuotaExceededOpen: boolean;
  onCloseQuotaExceeded: () => void;
  isUk: boolean;
  quotasSuppliersUsed?: number;
  quotasSuppliersMax?: number;
  currentPlanName: string;

  isReconciliationOpen: boolean;
  onCloseReconciliation: () => void;

  supplierToDelete: SupplierDto | null;
  onCloseDeleteDialog: () => void;
  onConfirmDeleteSupplier: () => Promise<void>;
}

export const SuppliersModals: React.FC<SuppliersModalsProps> = ({
  isCreateOpen,
  selectedSupplier,
  onCloseCreate,
  onSaveSupplier,
  isImportWizardOpen,
  importWizardSupplierId,
  suppliers,
  onCloseImportWizard,
  feedsModalSupplier,
  onCloseFeedsModal,
  onConnectNewFeed,
  pricingRulesSupplier,
  onClosePricingRules,
  isQuotaExceededOpen,
  onCloseQuotaExceeded,
  isUk,
  quotasSuppliersUsed,
  quotasSuppliersMax,
  currentPlanName,
  isReconciliationOpen,
  onCloseReconciliation,
  supplierToDelete,
  onCloseDeleteDialog,
  onConfirmDeleteSupplier,
}) => {
  return (
    <>
      <CreateSupplierDialog
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onSave={onSaveSupplier}
        initialData={selectedSupplier}
      />

      <ImportFeedWizardDialog
        isOpen={isImportWizardOpen}
        onClose={onCloseImportWizard}
        initialSupplierId={importWizardSupplierId}
        suppliers={suppliers}
      />

      <SupplierFeedsModal
        supplier={feedsModalSupplier}
        isOpen={Boolean(feedsModalSupplier)}
        onClose={onCloseFeedsModal}
        onConnectNewFeed={(s: SupplierDto) => onConnectNewFeed(s.id)}
      />

      <SupplierPricingRulesModal
        supplier={pricingRulesSupplier}
        isOpen={Boolean(pricingRulesSupplier)}
        onClose={onClosePricingRules}
      />

      <QuotaExceededDialog
        isOpen={isQuotaExceededOpen}
        onClose={onCloseQuotaExceeded}
        resourceName={isUk ? 'Постачальники' : 'Suppliers'}
        currentCount={quotasSuppliersUsed ?? 2}
        maxLimit={quotasSuppliersMax ?? 2}
        planName={currentPlanName}
      />

      <QuotaReconciliationDialog isOpen={isReconciliationOpen} onClose={onCloseReconciliation} />

      <ConfirmDeleteDialog
        isOpen={Boolean(supplierToDelete)}
        title={
          isUk
            ? `Видалити постачальника «${supplierToDelete?.name}»?`
            : `Delete supplier «${supplierToDelete?.name}»?`
        }
        description={
          isUk
            ? 'Усі підключені фіди та імпортовані товари цього постачальника будуть безповоротно видалені з бази даних.'
            : 'All connected feeds and imported products from this supplier will be permanently deleted.'
        }
        confirmLabel={isUk ? 'Видалити постачальника' : 'Delete Supplier'}
        cancelLabel={isUk ? 'Скасувати' : 'Cancel'}
        onConfirm={onConfirmDeleteSupplier}
        onClose={onCloseDeleteDialog}
      />
    </>
  );
};
