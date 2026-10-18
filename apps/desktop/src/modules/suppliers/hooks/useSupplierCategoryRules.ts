import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type SupplierCategoryRuleDto,
  type MarketplaceCategoryDto,
  type CreateMarketplaceCategoryDto,
  SEED_MARKETPLACE_CATEGORIES,
  suggestMarketplaceCategory,
} from '@smartfeed/shared';
import {
  type FeedSourceItemDto,
  getSupplierCategories,
  getSupplierFeedSources,
  toggleSupplierCategory,
  batchToggleSupplierCategories,
  updateSupplierCategoryRule,
  getMarketplaceCategories,
  createMarketplaceCategory,
} from '@/lib/api';
import { useDataSync } from '@/lib/syncEvents';

export interface UseSupplierCategoryRulesParams {
  supplierId: string;
  token?: string | null;
  onRefreshSupplier: () => void;
  selectedMarketplace: string;
}

export function useSupplierCategoryRules({
  supplierId,
  token,
  onRefreshSupplier,
  selectedMarketplace,
}: UseSupplierCategoryRulesParams) {
  const [categories, setCategories] = useState<SupplierCategoryRuleDto[]>([]);
  const [feedSources, setFeedSources] = useState<FeedSourceItemDto[]>([]);
  const [marketplaceCatalog, setMarketplaceCatalog] = useState<MarketplaceCategoryDto[]>(
    SEED_MARKETPLACE_CATEGORIES,
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catData, mpData, feedsData] = await Promise.all([
        getSupplierCategories(supplierId, token || undefined),
        getMarketplaceCategories(undefined, undefined, token || undefined),
        getSupplierFeedSources(supplierId, token || undefined),
      ]);
      console.log('[DEBUG_FEEDS] supplierId:', supplierId, 'feedsData:', JSON.stringify(feedsData));
      setMarketplaceCatalog(mpData && mpData.length > 0 ? mpData : SEED_MARKETPLACE_CATEGORIES);
      setCategories(catData || []);
      setFeedSources(feedsData || []);
    } catch (err) {
      console.warn('[useSupplierCategoryRules:loadData] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDataSync(['feeds', 'suppliers', 'all'], () => {
    loadData();
  });

  const handleToggleStatus = async (catId: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive;
      await toggleSupplierCategory(supplierId, catId, nextActive, token || undefined);
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, isActive: nextActive } : c)),
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierCategoryRules:handleToggleStatus] Error:', err);
    }
  };

  const handleBatchToggle = async (ids: string[], active: boolean) => {
    try {
      await batchToggleSupplierCategories(supplierId, ids, active, token || undefined);
      setCategories((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, isActive: active } : c)),
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierCategoryRules:handleBatchToggle] Error:', err);
    }
  };

  const handleUpdateRule = async (
    catId: string,
    patch: {
      marginPercent?: number | null;
      fixedMarkup?: number | null;
      commissionPercent?: number | null;
      marketplaceCategoryId?: string | null;
      externalCategoryId?: string | null;
      externalCategoryName?: string | null;
    },
  ) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const nextMappings = { ...(c.marketplaceMappings || {}) };
        const currentMap = nextMappings[selectedMarketplace];
        const extId =
          patch.externalCategoryId !== undefined
            ? patch.externalCategoryId
            : (currentMap?.externalCategoryId ?? c.externalCategoryId ?? null);
        const extName =
          patch.externalCategoryName !== undefined
            ? patch.externalCategoryName
            : (currentMap?.externalCategoryName ?? c.externalCategoryName ?? null);

        if (extId && extName) {
          nextMappings[selectedMarketplace] = {
            marketplaceCode: selectedMarketplace,
            marketplaceCategoryId:
              patch.marketplaceCategoryId ?? currentMap?.marketplaceCategoryId ?? null,
            externalCategoryId: extId,
            externalCategoryName: extName,
            commissionPercent: Number(
              patch.commissionPercent ?? currentMap?.commissionPercent ?? c.commissionPercent ?? 0,
            ),
            fixedFee: currentMap?.fixedFee ?? 0,
          };
        } else if (patch.externalCategoryId === null) {
          delete nextMappings[selectedMarketplace];
        }
        return {
          ...c,
          ...patch,
          marketplaceCode: selectedMarketplace,
          marketplaceMappings: nextMappings,
        };
      }),
    );

    try {
      await updateSupplierCategoryRule(
        supplierId,
        catId,
        { ...patch, marketplaceCode: selectedMarketplace },
        token || undefined,
      );
    } catch (err) {
      console.warn('[useSupplierCategoryRules:handleUpdateRule] Error:', err);
    }
  };

  const handleAutoMap = async () => {
    for (const cat of categories) {
      const matched = suggestMarketplaceCategory(cat.name, marketplaceCatalog, selectedMarketplace);
      if (matched) {
        await handleUpdateRule(cat.id, {
          marketplaceCategoryId: matched.id,
          externalCategoryId: matched.externalId,
          externalCategoryName: matched.nameUk,
          commissionPercent: matched.defaultCommissionPercent,
        });
      }
    }
  };

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

  const availableFeeds = useMemo(() => {
    const map = new Map<string, string>();
    for (const fs of feedSources) {
      if (fs.id && fs.name) map.set(fs.id, fs.name);
    }
    for (const c of categories) {
      if (c.feedSourceId && c.feedName) {
        map.set(c.feedSourceId, c.feedName);
      } else if (c.feedName && !Array.from(map.values()).includes(c.feedName)) {
        map.set(c.feedName, c.feedName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [feedSources, categories]);

  return {
    categories,
    setCategories,
    feedSources,
    marketplaceCatalog,
    isLoading,
    loadData,
    handleToggleStatus,
    handleBatchToggle,
    handleUpdateRule,
    handleAutoMap,
    handleCreateCustomCategory,
    availableFeeds,
  };
}
