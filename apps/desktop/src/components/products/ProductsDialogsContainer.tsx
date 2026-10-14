import React from 'react';
import type { ProductDto, SupplierDto } from '@smartfeed/shared';
import { ProductDetailsDrawer } from '@/components/products/ProductDetailsDrawer';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useTranslation } from '@/i18n';

interface ProductsDialogsContainerProps {
  drawerProduct: ProductDto | null;
  suppliers: SupplierDto[];
  onCloseDrawer: () => void;
  onProductUpdate: (updated: ProductDto) => void;
  productToDelete: ProductDto | null;
  onCloseSingleDelete: () => void;
  onConfirmSingleDelete: () => Promise<void>;
  isBulkDeleteOpen: boolean;
  selectedCount: number;
  onCloseBulkDelete: () => void;
  onConfirmBulkDelete: () => Promise<void>;
  isDeleting: boolean;
}

export const ProductsDialogsContainer: React.FC<ProductsDialogsContainerProps> = ({
  drawerProduct,
  suppliers,
  onCloseDrawer,
  onProductUpdate,
  productToDelete,
  onCloseSingleDelete,
  onConfirmSingleDelete,
  isBulkDeleteOpen,
  selectedCount,
  onCloseBulkDelete,
  onConfirmBulkDelete,
  isDeleting,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  return (
    <>
      <ProductDetailsDrawer
        product={drawerProduct}
        suppliers={suppliers}
        onClose={onCloseDrawer}
        onProductUpdate={onProductUpdate}
      />

      <ConfirmDeleteDialog
        isOpen={Boolean(productToDelete)}
        onClose={onCloseSingleDelete}
        onConfirm={onConfirmSingleDelete}
        title={t('catalogs:confirmDeleteProductTitle')}
        description={`${t('catalogs:confirmDeleteProductMessage')} (${productToDelete?.sku} — ${productToDelete?.titleUk})`}
        isLoading={isDeleting}
      />

      <ConfirmDeleteDialog
        isOpen={isBulkDeleteOpen}
        onClose={onCloseBulkDelete}
        onConfirm={onConfirmBulkDelete}
        title={t('catalogs:confirmDeleteBulkTitle')}
        description={t('catalogs:confirmDeleteBulkMessage', { count: selectedCount })}
        isLoading={isDeleting}
      />
    </>
  );
};
