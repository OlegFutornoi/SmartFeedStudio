import type { SupplierCategoryRuleDto } from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';

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

  // Find all products belonging to this supplier (either by supplierId or supplierName)
  const supplierProducts = state.products.filter(
    (p) =>
      p.supplierId === targetSupplierId ||
      p.supplierId === supplierId ||
      (targetSupplierName && p.supplierName?.toLowerCase() === targetSupplierName),
  );

  // If products were found with mismatched supplierId, normalize them
  if (supplier && supplierProducts.length > 0) {
    for (const p of supplierProducts) {
      if (p.supplierId !== targetSupplierId) {
        p.supplierId = targetSupplierId;
      }
      if (!p.supplierName) {
        p.supplierName = supplier.name;
      }
    }
  }

  // If supplier has no products and dummy fallback was previously stored, clean it up
  if (
    supplierProducts.length === 0 &&
    list &&
    list.some(
      (c) =>
        c.feedCategoryId === 'cat_electronics' ||
        c.feedCategoryId === 'cat_accessories' ||
        c.feedCategoryId === 'cat_smartphones',
    )
  ) {
    state.supplierCategories.delete(targetSupplierId);
    return [];
  }

  // If supplier has no products at all, return empty
  if (supplierProducts.length === 0) {
    return list || [];
  }

  // Look up feed names from feedSources
  const feedSources = state.feedSources.get(targetSupplierId) || [];
  const allFeeds = Array.from(state.feedSources.values()).flat();
  const feedMap = new Map<string, string>();
  for (const f of allFeeds) feedMap.set(f.id, f.name);
  for (const f of feedSources) feedMap.set(f.id, f.name);

  // Map existing rules to preserve user-configured isActive, marginPercent, fixedMarkup
  const existingRulesMap = new Map<string, SupplierCategoryRuleDto>();
  if (list) {
    for (const r of list) {
      const key = `${r.feedCategoryId}::${r.feedSourceId || ''}`;
      existingRulesMap.set(key, r);
      existingRulesMap.set(r.feedCategoryId, r);
    }
  }

  // Group categories by feedCategoryId AND feedSourceId
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
      (feedSourceId ? feedMap.get(feedSourceId) : null) || feedSources[0]?.name || 'Основний фід';

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

  const now = new Date().toISOString();
  const updatedList: SupplierCategoryRuleDto[] = Array.from(catMap.entries()).map(
    ([groupKey, info]) => {
      const prevRule = existingRulesMap.get(groupKey) || existingRulesMap.get(info.catId);
      return {
        id:
          prevRule?.id ||
          `scat_${targetSupplierId}_${info.catId}_${info.feedSourceId || 'default'}`,
        supplierId: targetSupplierId,
        feedCategoryId: info.catId,
        name: info.name,
        parentId: prevRule?.parentId || null,
        isActive: prevRule?.isActive ?? true,
        marginPercent: prevRule?.marginPercent ?? null,
        fixedMarkup: prevRule?.fixedMarkup ?? null,
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

export function toggleSupplierCategory(
  state: MockDbState,
  supplierId: string,
  categoryId: string,
  isActive: boolean,
): SupplierCategoryRuleDto {
  const list = ensureSupplierCategories(state, supplierId);
  const target = list.find((c) => c.id === categoryId || c.feedCategoryId === categoryId);
  if (!target) {
    throw new Error(`Категорія ${categoryId} не знайдена у постачальника`);
  }
  target.isActive = isActive;
  target.updatedAt = new Date().toISOString();

  // Cascade to products: tag availability according to category active status and feedSourceId
  state.products = state.products.map((p) => {
    const isSupplierMatch =
      p.supplierId === supplierId ||
      (state.suppliers.find((s) => s.id === supplierId)?.name &&
        p.supplierName === state.suppliers.find((s) => s.id === supplierId)?.name);
    const isCategoryMatch = p.categoryId === target.feedCategoryId || p.categoryId === target.id;
    const isFeedMatch =
      !target.feedSourceId || !p.feedSourceId || p.feedSourceId === target.feedSourceId;

    if (isSupplierMatch && isCategoryMatch && isFeedMatch) {
      return { ...p, inStock: isActive, isAvailable: isActive };
    }
    return p;
  });

  return target;
}

export function batchToggleSupplierCategories(
  state: MockDbState,
  supplierId: string,
  categoryIds: string[],
  isActive: boolean,
): { updatedCount: number } {
  const list = ensureSupplierCategories(state, supplierId);
  let updatedCount = 0;
  const idSet = new Set(categoryIds);

  for (const cat of list) {
    if (idSet.has(cat.id) || idSet.has(cat.feedCategoryId)) {
      cat.isActive = isActive;
      cat.updatedAt = new Date().toISOString();
      updatedCount += 1;
    }
  }

  // Cascade to products
  state.products = state.products.map((p) => {
    if (
      (p.supplierId === supplierId ||
        (p.supplierName &&
          state.suppliers.find((s) => s.id === supplierId)?.name === p.supplierName)) &&
      (idSet.has(p.categoryId || '') || idSet.has(p.id))
    ) {
      return { ...p, inStock: isActive, isAvailable: isActive };
    }
    return p;
  });

  return { updatedCount };
}

export function updateSupplierCategoryRule(
  state: MockDbState,
  supplierId: string,
  categoryId: string,
  marginPercent?: number | null,
  fixedMarkup?: number | null,
): SupplierCategoryRuleDto {
  const list = ensureSupplierCategories(state, supplierId);
  const target = list.find((c) => c.id === categoryId || c.feedCategoryId === categoryId);
  if (!target) {
    throw new Error(`Категорія ${categoryId} не знайдена у постачальника`);
  }

  if (marginPercent !== undefined) {
    target.marginPercent = marginPercent !== null ? Number(marginPercent) : null;
  }
  if (fixedMarkup !== undefined) {
    target.fixedMarkup = fixedMarkup !== null ? Number(fixedMarkup) : null;
  }
  target.updatedAt = new Date().toISOString();
  return target;
}
