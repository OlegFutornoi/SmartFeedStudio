import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/api';
import { useDataSync, emitDataSync } from '@/lib/syncEvents';
import { isTauri } from '@/lib/runtime';

type QuotaKey = 'suppliers' | 'products' | 'feeds' | 'channels' | 'teamSeats' | 'aiCredits';

interface UseSuppliersCrudOptions {
  token: string | null;
  isAuthenticated: boolean;
  selectedSupplierForDrawer: SupplierDto | null;
  setSelectedSupplierForDrawer: React.Dispatch<React.SetStateAction<SupplierDto | null>>;
  supplierToEdit: SupplierDto | null;
  supplierToDelete: SupplierDto | null;
  closeCreateOrEdit: () => void;
  closeDelete: () => void;
  closeDrawer: () => void;
  updateLocalQuota: (quota: QuotaKey, delta: number) => void;
  setLocalQuotaUsed: (quota: QuotaKey, count: number) => void;
  refreshQuotas: () => void;
}

export function useSuppliersCrud({
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
}: UseSuppliersCrudOptions) {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const lastFetchedTokenRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchSuppliers = useCallback(
    async (force = false, silent = false) => {
      if (!isTauri() && (!token || !isAuthenticated)) return;
      const fetchKey = token || 'tauri-local';
      if (!force && lastFetchedTokenRef.current === fetchKey) return;
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        if (!silent) setIsLoading(true);
        const data = await getSuppliers(token || undefined);
        lastFetchedTokenRef.current = fetchKey;
        setSuppliers(data || []);
        setLocalQuotaUsed('suppliers', data ? data.length : 0);

        if (selectedSupplierForDrawer) {
          const updated = data?.find((s) => s.id === selectedSupplierForDrawer.id);
          if (updated) setSelectedSupplierForDrawer(updated);
        }
      } catch (err) {
        console.warn('[SuppliersListPage:fetchSuppliers] Error:', err);
      } finally {
        if (!silent) setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [
      token,
      isAuthenticated,
      setLocalQuotaUsed,
      selectedSupplierForDrawer,
      setSelectedSupplierForDrawer,
    ],
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all'], () => {
    fetchSuppliers(true, true);
  });

  const handleSaveSupplier = async (dto: CreateSupplierDto) => {
    try {
      if (supplierToEdit) {
        const updated = await updateSupplier(supplierToEdit.id, dto, token || undefined);
        if (selectedSupplierForDrawer?.id === supplierToEdit.id && updated) {
          setSelectedSupplierForDrawer(updated);
        }
      } else {
        await createSupplier(dto, token || undefined);
        updateLocalQuota('suppliers', 1);
      }
      refreshQuotas();
      emitDataSync(['suppliers', 'quotas']);
      closeCreateOrEdit();
      fetchSuppliers(true, true);
    } catch (err) {
      console.warn('[SuppliersListPage:handleSaveSupplier] Error:', err);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    const target = supplierToDelete;
    closeDelete();
    try {
      await deleteSupplier(target.id, token || undefined);
      updateLocalQuota('suppliers', -1);
      if (target.productsCount) updateLocalQuota('products', -target.productsCount);
      if (target.activeFeedsCount) updateLocalQuota('feeds', -target.activeFeedsCount);
      refreshQuotas();
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
      if (selectedSupplierForDrawer?.id === target.id) {
        closeDrawer();
      }
      fetchSuppliers(true, true);
    } catch (err) {
      console.warn('[SuppliersListPage:handleConfirmDelete] Error:', err);
    }
  };

  const handleToggleStatus = async (supplier: SupplierDto) => {
    const previousSuppliers = [...suppliers];
    const newIsActive = !supplier.isActive;

    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplier.id ? { ...s, isActive: newIsActive } : s)),
    );
    if (selectedSupplierForDrawer?.id === supplier.id) {
      setSelectedSupplierForDrawer((prev: SupplierDto | null) =>
        prev ? { ...prev, isActive: newIsActive } : null,
      );
    }

    try {
      await updateSupplier(supplier.id, { isActive: newIsActive }, token || undefined);
    } catch (err) {
      console.warn('[SuppliersListPage:handleToggleStatus] Error toggling status:', err);
      setSuppliers(previousSuppliers);
      if (selectedSupplierForDrawer?.id === supplier.id) {
        setSelectedSupplierForDrawer((prev: SupplierDto | null) =>
          prev ? { ...prev, isActive: !newIsActive } : null,
        );
      }
    }
  };

  return {
    suppliers,
    isLoading,
    fetchSuppliers,
    handleSaveSupplier,
    handleConfirmDelete,
    handleToggleStatus,
  };
}
