import { useState } from 'react';
import { SupplierDto } from '@smartfeed/shared';

export function useSuppliersListPageState() {
  const [selectedSupplierForDrawer, setSelectedSupplierForDrawer] = useState<SupplierDto | null>(
    null,
  );
  const [drawerInitialTab, setDrawerInitialTab] = useState<string>('overview');
  const [feedWizardSupplierId, setFeedWizardSupplierId] = useState<string | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierDto | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const openDrawer = (supplier: SupplierDto, initialTab = 'overview') => {
    setDrawerInitialTab(initialTab);
    setSelectedSupplierForDrawer(supplier);
  };

  const closeDrawer = () => {
    setSelectedSupplierForDrawer(null);
  };

  const openCreate = () => {
    setSupplierToEdit(null);
    setIsCreateOpen(true);
  };

  const openEdit = (supplier: SupplierDto) => {
    setSupplierToEdit(supplier);
  };

  const closeCreateOrEdit = () => {
    setIsCreateOpen(false);
    setSupplierToEdit(null);
  };

  const openDelete = (supplier: SupplierDto) => {
    setSupplierToDelete(supplier);
  };

  const closeDelete = () => {
    setSupplierToDelete(null);
  };

  const openFeedWizard = (supplierId: string) => {
    setFeedWizardSupplierId(supplierId);
  };

  const closeFeedWizard = () => {
    setFeedWizardSupplierId(null);
  };

  return {
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
  };
}
