import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type SupplierCategoryRuleDto,
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
} from '@/lib/api';
import { useDataSync } from '@/lib/syncEvents';
import type { CategoryMappingFilter } from '@/modules/suppliers/components/details/tabs/SupplierCategoriesToolbar';
import { useMarketplaceCatalog } from '@/modules/suppliers/components/details/tabs/useMarketplaceCatalog';

export type CategoryRulePatch = {
  markupType?: 'PERCENT' | 'FIXED';
  marginPercent?: number | null;
  fixedMarkup?: number | null;
  commissionPercent?: number | null;
  marketplaceCategoryId?: string | null;
  externalCategoryId?: string | null;
  externalCategoryName?: string | null;
};

export function useSupplierCategoriesState(
  supplierId: string,
  token: string | null | undefined,
  onRefreshSupplier: () => void,
) {
  const [categories, setCategories] = useState<SupplierCategoryRuleDto[]>([]);
  const [feedSources, setFeedSources] = useState<FeedSourceItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFeedId, setSelectedFeedId] = useState<string>('ALL');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('ROZETKA');
  const [mappingFilter, setMappingFilter] = useState<CategoryMappingFilter>('ALL');
  const [pickerTarget, setPickerTarget] = useState<SupplierCategoryRuleDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    marketplaceCatalog,
    setMarketplaceCatalog,
    handleCreateCustomCategory,
    handleUpdateMarketplaceCategory,
    handleImportMarketplaceCategories,
  } = useMarketplaceCatalog(token, setCategories);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catData, mpData, feedsData] = await Promise.all([
        getSupplierCategories(supplierId, token || undefined),
        getMarketplaceCategories(undefined, undefined, token || undefined),
        getSupplierFeedSources(supplierId, token || undefined),
      ]);
      setMarketplaceCatalog(mpData && mpData.length > 0 ? mpData : SEED_MARKETPLACE_CATEGORIES);
      setCategories(catData || []);
      setFeedSources(feedsData || []);
    } catch (err) {
      console.warn('[useSupplierCategoriesState:loadData] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId, token, setMarketplaceCatalog]);

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
      console.warn('[useSupplierCategoriesState:handleToggleStatus] Error:', err);
    }
  };

  const handleUpdateRule = async (catId: string, patch: CategoryRulePatch) => {
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

        const isFixed =
          patch.markupType === 'FIXED' ||
          (patch.fixedMarkup !== undefined &&
            patch.markupType !== 'PERCENT' &&
            patch.marginPercent === undefined);
        const isPercent =
          patch.markupType === 'PERCENT' ||
          (patch.marginPercent !== undefined &&
            patch.markupType !== 'FIXED' &&
            patch.fixedMarkup === undefined);

        return {
          ...c,
          ...patch,
          markupType: isFixed
            ? 'FIXED'
            : isPercent
              ? 'PERCENT'
              : (patch.markupType ?? c.markupType ?? 'PERCENT'),
          marginPercent: isFixed
            ? null
            : patch.marginPercent !== undefined
              ? patch.marginPercent
              : c.marginPercent,
          fixedMarkup: isPercent
            ? null
            : patch.fixedMarkup !== undefined
              ? patch.fixedMarkup
              : c.fixedMarkup,
          marketplaceCode: selectedMarketplace,
          marketplaceMappings: nextMappings,
        };
      }),
    );

    try {
      const targetCat = categories.find((c) => c.id === catId);
      await updateSupplierCategoryRule(
        supplierId,
        catId,
        {
          ...patch,
          name: targetCat?.name && !targetCat.name.startsWith('scat_') ? targetCat.name : undefined,
          feedCategoryId:
            targetCat?.feedCategoryId && !targetCat.feedCategoryId.startsWith('scat_')
              ? targetCat.feedCategoryId
              : undefined,
          feedSourceId: targetCat?.feedSourceId ?? undefined,
          feedName: targetCat?.feedName ?? undefined,
          productCount: targetCat?.productCount ?? undefined,
          marketplaceCode: selectedMarketplace,
        },
        token || undefined,
      );
    } catch (err) {
      console.warn('[useSupplierCategoriesState:handleUpdateRule] Error:', err);
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

  const availableFeeds = useMemo(() => {
    const seenNames = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const fs of feedSources) {
      if (fs.id && fs.name && !seenNames.has(fs.name)) {
        seenNames.add(fs.name);
        result.push({ id: fs.id, name: fs.name });
      }
    }
    for (const c of categories) {
      const name = c.feedName;
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        result.push({ id: c.feedSourceId || name, name });
      }
    }
    return result;
  }, [feedSources, categories]);

  const isCategoryMapped = useCallback(
    (c: SupplierCategoryRuleDto) =>
      Boolean(
        c.marketplaceMappings?.[selectedMarketplace]?.externalCategoryId ||
        (c.marketplaceCode === selectedMarketplace && c.externalCategoryId),
      ),
    [selectedMarketplace],
  );

  const filtered = useMemo(() => {
    let list = categories;
    if (selectedFeedId && selectedFeedId !== 'ALL') {
      const feedObj = availableFeeds.find((f) => f.id === selectedFeedId);
      list = list.filter(
        (c) =>
          c.feedSourceId === selectedFeedId ||
          c.feedName === selectedFeedId ||
          (feedObj?.name && c.feedName === feedObj.name),
      );
    }
    if (mappingFilter === 'MAPPED') list = list.filter(isCategoryMapped);
    else if (mappingFilter === 'UNMAPPED') list = list.filter((c) => !isCategoryMapped(c));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.externalCategoryName?.toLowerCase().includes(q) ||
          c.externalCategoryId?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [categories, selectedFeedId, availableFeeds, mappingFilter, search, isCategoryMapped]);

  const handleBatchToggle = async (active: boolean) => {
    try {
      const ids = filtered.map((c) => c.id);
      await batchToggleSupplierCategories(supplierId, ids, active, token || undefined);
      setCategories((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, isActive: active } : c)),
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierCategoriesState:handleBatchToggle] Error:', err);
    }
  };

  return {
    categories,
    feedSources,
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
  };
}
