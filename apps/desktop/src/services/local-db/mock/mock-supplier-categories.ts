import { type SupplierCategoryRuleDto, SEED_MARKETPLACE_CATEGORIES } from '@smartfeed/shared';

import type { MockDbState } from '@/services/local-db/mock/mock-state';
import { buildDefaultCategoryMappings } from '@/services/local-db/mock/mock-category-mapping-builder';

export function ensureSupplierCategories(
  state: MockDbState,
  supplierId: string,
): SupplierCategoryRuleDto[] {
  const supplier = state.suppliers.find(
    (s) => s.id === supplierId || (s.name && s.name.toLowerCase() === supplierId.toLowerCase()),
  );
  const targetSupplierId = supplier ? supplier.id : supplierId;
  const targetSupplierName = supplier?.name?.toLowerCase();
  const list = state.supplierCategories.get(targetSupplierId);

  const supplierProducts = state.products.filter(
    (p) =>
      p.supplierId === targetSupplierId ||
      p.supplierId === supplierId ||
      (targetSupplierName && p.supplierName?.toLowerCase() === targetSupplierName),
  );

  if (supplier && supplierProducts.length > 0) {
    for (const p of supplierProducts) {
      if (p.supplierId !== targetSupplierId) p.supplierId = targetSupplierId;
      if (!p.supplierName) p.supplierName = supplier.name;
    }
  }

  const feedSources =
    state.feedSources.get(targetSupplierId) || state.feedSources.get(supplierId) || [];

  // DB-REF-03: "Нема постачальника / нема фіда — нема категорій"
  if (feedSources.length === 0) {
    state.supplierCategories.delete(targetSupplierId);
    return [];
  }

  if (
    supplierProducts.length === 0 &&
    list?.some((c) =>
      ['cat_electronics', 'cat_accessories', 'cat_smartphones'].includes(c.feedCategoryId),
    )
  ) {
    state.supplierCategories.delete(targetSupplierId);
    return [];
  }

  if (supplierProducts.length === 0) {
    if (!list) return [];
    const activeFeedIds = new Set(feedSources.map((f) => f.id));
    const validCats = list.filter((c) => !c.feedSourceId || activeFeedIds.has(c.feedSourceId));
    if (validCats.length === 0) {
      state.supplierCategories.delete(targetSupplierId);
      return [];
    }
    const sanitized = validCats.map((c) => {
      const isSynthetic = !c.name || c.name.startsWith('scat_');
      const cleanFeedCatId = c.feedCategoryId?.startsWith('scat_')
        ? c.feedCategoryId.split('_')[2] || c.feedCategoryId
        : c.feedCategoryId;
      const cleanName = isSynthetic
        ? c.externalCategoryName ||
          (cleanFeedCatId && !cleanFeedCatId.startsWith('scat_')
            ? `Категорія #${cleanFeedCatId}`
            : 'Загальна категорія')
        : c.name;
      return { ...c, name: cleanName, feedCategoryId: cleanFeedCatId || c.feedCategoryId };
    });
    state.supplierCategories.set(targetSupplierId, sanitized);
    return sanitized;
  }

  const feedMap = new Map<string, string>();
  for (const f of Array.from(state.feedSources.values()).flat()) feedMap.set(f.id, f.name);
  for (const f of feedSources) feedMap.set(f.id, f.name);

  const existingRulesMap = new Map<string, SupplierCategoryRuleDto>();
  for (const r of list || []) {
    existingRulesMap.set(`${r.feedCategoryId}::${r.feedSourceId || ''}`, r);
    existingRulesMap.set(r.feedCategoryId, r);
  }

  const catMap = new Map<
    string,
    {
      catId: string;
      name: string;
      count: number;
      feedSourceId?: string | null;
      feedName?: string | null;
    }
  >();

  for (const p of supplierProducts) {
    const catId = p.categoryId || 'default';
    const catName = p.categoryNameUk || 'Загальна категорія';
    const feedSourceId = p.feedSourceId || feedSources[0]?.id || null;
    const feedName =
      (feedSourceId ? feedMap.get(feedSourceId) : null) ||
      (p.feedSourceId
        ? `Фід #${p.feedSourceId.slice(0, 8)}`
        : feedSources[0]?.name || 'Основний фід');
    const groupKey = `${catId}::${feedSourceId || ''}`;
    const existing = catMap.get(groupKey) || {
      catId,
      name: catName,
      count: 0,
      feedSourceId,
      feedName,
    };
    existing.count += 1;
    catMap.set(groupKey, existing);
  }

  const catalog =
    state.marketplaceCategories && state.marketplaceCategories.length > 0
      ? state.marketplaceCategories
      : SEED_MARKETPLACE_CATEGORIES;

  const now = new Date().toISOString();
  const updatedList: SupplierCategoryRuleDto[] = Array.from(catMap.entries()).map(
    ([groupKey, info]) => {
      const prevRule = existingRulesMap.get(groupKey) || existingRulesMap.get(info.catId);
      const { mappings, activeMp, activeMap } = buildDefaultCategoryMappings(
        info.name,
        prevRule,
        catalog,
      );

      return {
        id:
          prevRule?.id ||
          `scat_${targetSupplierId}_${info.catId}_${info.feedSourceId || 'default'}`,
        supplierId: targetSupplierId,
        feedCategoryId: info.catId,
        name: info.name,
        parentId: prevRule?.parentId || null,
        isActive: prevRule?.isActive ?? true,
        markupType:
          prevRule?.markupType ||
          (prevRule?.fixedMarkup != null && prevRule?.marginPercent == null ? 'FIXED' : 'PERCENT'),
        marginPercent: prevRule?.marginPercent ?? null,
        fixedMarkup: prevRule?.fixedMarkup ?? null,
        commissionPercent: prevRule?.commissionPercent ?? activeMap?.commissionPercent ?? null,
        marketplaceCategoryId:
          prevRule?.marketplaceCategoryId ?? activeMap?.marketplaceCategoryId ?? null,
        marketplaceCode: activeMp,
        externalCategoryId: prevRule?.externalCategoryId ?? activeMap?.externalCategoryId ?? null,
        externalCategoryName:
          prevRule?.externalCategoryName ?? activeMap?.externalCategoryName ?? null,
        marketplaceMappings: mappings,
        productCount: info.count,
        feedSourceId: info.feedSourceId || null,
        feedName: info.feedName || null,
        createdAt: prevRule?.createdAt || now,
        updatedAt: now,
      };
    },
  );

  state.supplierCategories.set(targetSupplierId, updatedList);
  return updatedList;
}

export function getSupplierCategories(
  state: MockDbState,
  supplierId: string,
  search?: string,
): SupplierCategoryRuleDto[] {
  let list = ensureSupplierCategories(state, supplierId);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(q));
  }
  return list;
}

export {
  toggleSupplierCategory,
  batchToggleSupplierCategories,
  updateSupplierCategoryRule,
} from '@/services/local-db/mock/mock-supplier-category-updates';
