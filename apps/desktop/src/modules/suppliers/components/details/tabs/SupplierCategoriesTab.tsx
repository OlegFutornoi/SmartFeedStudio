import React from 'react';
import { FolderTree } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody } from '@/components/ui/table';
import type { SupplierDto } from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { SupplierCategoryRow } from '@/modules/suppliers/components/details/tabs/SupplierCategoryRow';
import { SupplierCategoriesToolbar } from '@/modules/suppliers/components/details/tabs/SupplierCategoriesToolbar';
import { SupplierCategoriesTableHeader } from '@/modules/suppliers/components/details/tabs/SupplierCategoriesTableHeader';
import { MarketplaceCategoryDrawer } from '@/modules/suppliers/components/details/tabs/MarketplaceCategoryDrawer';
import { useSupplierCategoriesState } from '@/modules/suppliers/components/details/tabs/useSupplierCategoriesState';

interface SupplierCategoriesTabProps {
  supplier: SupplierDto;
  onRefreshSupplier: () => void;
}

export const SupplierCategoriesTab: React.FC<SupplierCategoriesTabProps> = ({
  supplier,
  onRefreshSupplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const { token } = useAuth();

  const {
    categories,
    marketplaceCatalog,
    search,
    setSearch,
    selectedFeedId,
    setSelectedFeedId,
    selectedMarketplace,
    setSelectedMarketplace,
    mappingFilter,
    setMappingFilter,
    pickerTarget,
    setPickerTarget,
    isLoading,
    availableFeeds,
    filtered,
    isCategoryMapped,
    handleToggleStatus,
    handleBatchToggle,
    handleUpdateRule,
    handleAutoMap,
    handleCreateCustomCategory,
    handleUpdateMarketplaceCategory,
    handleImportMarketplaceCategories,
  } = useSupplierCategoriesState(supplier.id, token, onRefreshSupplier);

  return (
    <div className="space-y-3" data-testid="supplier-categories-tab">
      <SupplierCategoriesToolbar
        search={search}
        onSearchChange={setSearch}
        selectedFeedId={selectedFeedId}
        onSelectFeedId={setSelectedFeedId}
        availableFeeds={availableFeeds}
        selectedMarketplace={selectedMarketplace}
        onSelectMarketplace={setSelectedMarketplace}
        mappingFilter={mappingFilter}
        onMappingFilterChange={setMappingFilter}
        activeCount={categories.filter((c) => c.isActive).length}
        mappedCount={categories.filter(isCategoryMapped).length}
        totalCount={categories.length}
        onBatchToggle={handleBatchToggle}
        onAutoMap={handleAutoMap}
      />

      {isLoading ? (
        <Card className="border border-border/80 bg-card/40 p-8 text-center">
          <p className="text-xs text-muted-foreground animate-pulse">
            {t('common:loading', { defaultValue: 'Завантаження...' })}
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/40 p-8 text-center flex flex-col items-center justify-center">
          <FolderTree className="size-8 text-muted-foreground/50 mb-2" />
          <p className="text-xs font-semibold text-foreground">
            {selectedFeedId !== 'ALL'
              ? t('suppliers:noCategoriesForFeedYet', {
                  defaultValue: 'Для обраного фіду ще немає імпортованих категорій.',
                })
              : search || mappingFilter !== 'ALL'
                ? t('suppliers:noCategoriesFound', {
                    defaultValue: 'Категорій за запитом не знайдено',
                  })
                : t('suppliers:noCategoriesYet', {
                    defaultValue: 'У цього постачальника ще немає категорій',
                  })}
          </p>
        </Card>
      ) : (
        <div className="border border-border/80 rounded-lg bg-card overflow-hidden shadow-xs">
          <Table className="text-xs">
            <SupplierCategoriesTableHeader />
            <TableBody>
              {filtered.map((cat) => (
                <SupplierCategoryRow
                  key={cat.id}
                  category={cat}
                  selectedMarketplace={selectedMarketplace}
                  defaultMarginPercent={supplier.defaultMarginPercent || 0}
                  onToggleStatus={handleToggleStatus}
                  onUpdateRule={handleUpdateRule}
                  onOpenMarketplacePicker={setPickerTarget}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MarketplaceCategoryDrawer
        open={Boolean(pickerTarget)}
        onOpenChange={(open) => {
          if (!open) setPickerTarget(null);
        }}
        supplierCategory={pickerTarget}
        marketplaceCode={selectedMarketplace}
        catalog={marketplaceCatalog}
        onSelectCategory={async (item) => {
          if (!pickerTarget) return;
          await handleUpdateRule(pickerTarget.id, {
            marketplaceCategoryId: item.id,
            externalCategoryId: item.externalId,
            externalCategoryName: item.nameUk,
            commissionPercent: item.defaultCommissionPercent,
          });
        }}
        onClearMapping={async () => {
          if (!pickerTarget) return;
          await handleUpdateRule(pickerTarget.id, {
            marketplaceCategoryId: null,
            externalCategoryId: null,
            externalCategoryName: null,
            commissionPercent: null,
          });
        }}
        onCreateCategory={handleCreateCustomCategory}
        onUpdateCategory={handleUpdateMarketplaceCategory}
        onImportCategories={handleImportMarketplaceCategories}
      />
    </div>
  );
};
