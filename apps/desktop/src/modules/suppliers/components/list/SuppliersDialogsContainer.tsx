import React from 'react';
import { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { SupplierDrawerSheet } from '@/modules/suppliers/components/drawer/SupplierDrawerSheet';
import { SupplierFormSheet } from '@/modules/suppliers/components/forms/SupplierFormSheet';
import { ImportFeedWizardDialog } from '@/components/feeds/ImportFeedWizardDialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useTranslation } from '@/i18n';

export interface SuppliersDialogsContainerProps {
  suppliers: SupplierDto[];
  selectedSupplierForDrawer: SupplierDto | null;
  drawerInitialTab: string;
  feedWizardSupplierId: string | null;
  supplierToEdit: SupplierDto | null;
  supplierToDelete: SupplierDto | null;
  isCreateOpen: boolean;
  onCloseDrawer: () => void;
  onToggleStatus: (supplier: SupplierDto) => void;
  onEditSupplier: (supplier: SupplierDto) => void;
  onOpenDelete: (supplier: SupplierDto) => void;
  onRefreshSupplier: () => void;
  onConnectFeed: (supplierId: string) => void;
  onCloseFeedWizard: () => void;
  onFeedWizardSuccess: () => void;
  onCloseCreateOrEdit: () => void;
  onSaveSupplier: (dto: CreateSupplierDto) => Promise<void>;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
}

export const SuppliersDialogsContainer: React.FC<SuppliersDialogsContainerProps> = ({
  suppliers,
  selectedSupplierForDrawer,
  drawerInitialTab,
  feedWizardSupplierId,
  supplierToEdit,
  supplierToDelete,
  isCreateOpen,
  onCloseDrawer,
  onToggleStatus,
  onEditSupplier,
  onOpenDelete,
  onRefreshSupplier,
  onConnectFeed,
  onCloseFeedWizard,
  onFeedWizardSuccess,
  onCloseCreateOrEdit,
  onSaveSupplier,
  onCloseDelete,
  onConfirmDelete,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <>
      {/* Slide-Over Drawer Sheet (NexaCRM style) */}
      <SupplierDrawerSheet
        isOpen={Boolean(selectedSupplierForDrawer)}
        supplier={selectedSupplierForDrawer}
        initialTab={drawerInitialTab}
        onClose={onCloseDrawer}
        onToggleStatus={() =>
          selectedSupplierForDrawer && onToggleStatus(selectedSupplierForDrawer)
        }
        onEdit={(s) => onEditSupplier(s)}
        onDelete={(id) => {
          const sup = suppliers.find((s) => s.id === id);
          if (sup) onOpenDelete(sup);
        }}
        onRefreshSupplier={onRefreshSupplier}
        onConnectFeed={() => {
          if (selectedSupplierForDrawer) {
            onConnectFeed(selectedSupplierForDrawer.id);
          }
        }}
      />

      {/* Import Feed Wizard Modal */}
      <ImportFeedWizardDialog
        isOpen={Boolean(feedWizardSupplierId)}
        suppliers={suppliers}
        initialSupplierId={feedWizardSupplierId || undefined}
        onClose={onCloseFeedWizard}
        onSuccess={onFeedWizardSuccess}
      />

      {/* Create / Edit Slide-Over Sheet (Zero Modals, side="left") */}
      <SupplierFormSheet
        isOpen={isCreateOpen || Boolean(supplierToEdit)}
        supplierToEdit={supplierToEdit}
        onClose={onCloseCreateOrEdit}
        onSave={onSaveSupplier}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={!!supplierToDelete}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        title={t('suppliers:deleteSupplierTitle', { defaultValue: 'Видалити постачальника?' })}
        description={t('suppliers:deleteSupplierDesc', {
          defaultValue:
            'Ця дія каскадно видалить підключені джерела фідів, імпортовані товари та правила націнки.',
        })}
      />
    </>
  );
};
