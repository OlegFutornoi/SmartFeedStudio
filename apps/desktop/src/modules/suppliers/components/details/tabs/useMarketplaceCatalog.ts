import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  type SupplierCategoryRuleDto,
  type MarketplaceCategoryDto,
  type CreateMarketplaceCategoryDto,
  type UpdateMarketplaceCategoryDto,
  SEED_MARKETPLACE_CATEGORIES,
} from '@smartfeed/shared';
import {
  getMarketplaceCategories,
  createMarketplaceCategory,
  updateMarketplaceCategory,
  importMarketplaceCategories,
} from '@/lib/api';

export function useMarketplaceCatalog(
  token: string | null | undefined,
  setCategories: Dispatch<SetStateAction<SupplierCategoryRuleDto[]>>,
) {
  const [marketplaceCatalog, setMarketplaceCatalog] = useState<MarketplaceCategoryDto[]>(
    SEED_MARKETPLACE_CATEGORIES,
  );

  const handleCreateCustomCategory = async (
    payload: CreateMarketplaceCategoryDto,
  ): Promise<MarketplaceCategoryDto> => {
    const created = await createMarketplaceCategory(payload, token || undefined);
    setMarketplaceCatalog((prev) => [
      created,
      ...prev.filter(
        (c) =>
          !(c.marketplaceCode === created.marketplaceCode && c.externalId === created.externalId),
      ),
    ]);
    return created;
  };

  const handleUpdateMarketplaceCategory = async (
    id: string,
    payload: UpdateMarketplaceCategoryDto,
  ): Promise<MarketplaceCategoryDto> => {
    const updated = await updateMarketplaceCategory(id, payload, token || undefined);
    setMarketplaceCatalog((prev) =>
      prev.map((c) => (c.id === id || c.externalId === id ? updated : c)),
    );
    setCategories((prev) =>
      prev.map((c) => {
        const matches =
          c.marketplaceCategoryId === id ||
          c.externalCategoryId === id ||
          c.externalCategoryId === updated.externalId;
        if (!matches) return c;
        const nextMappings = { ...(c.marketplaceMappings || {}) };
        if (nextMappings[updated.marketplaceCode]) {
          nextMappings[updated.marketplaceCode].externalCategoryName = updated.nameUk;
          nextMappings[updated.marketplaceCode].externalCategoryId = updated.externalId;
          nextMappings[updated.marketplaceCode].commissionPercent =
            updated.defaultCommissionPercent;
        }
        return {
          ...c,
          externalCategoryName: updated.nameUk,
          externalCategoryId: updated.externalId,
          commissionPercent: updated.defaultCommissionPercent,
          marketplaceMappings: nextMappings,
        };
      }),
    );
    return updated;
  };

  const handleImportMarketplaceCategories = async (
    items: CreateMarketplaceCategoryDto[],
  ): Promise<{ importedCount: number }> => {
    const res = await importMarketplaceCategories(items, token || undefined);
    const refreshed = await getMarketplaceCategories(undefined, undefined, token || undefined);
    if (refreshed && refreshed.length > 0) setMarketplaceCatalog(refreshed);
    return res;
  };

  return {
    marketplaceCatalog,
    setMarketplaceCatalog,
    handleCreateCustomCategory,
    handleUpdateMarketplaceCategory,
    handleImportMarketplaceCategories,
  };
}
