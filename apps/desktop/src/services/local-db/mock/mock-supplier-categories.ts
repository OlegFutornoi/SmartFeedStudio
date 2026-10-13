import type { SupplierCategoryRuleDto } from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';

export function ensureSupplierCategories(
  state: MockDbState,
  supplierId: string,
): SupplierCategoryRuleDto[] {
  let list = state.supplierCategories.get(supplierId);
  const supplierProducts = state.products.filter((p) => p.supplierId === supplierId);

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
    state.supplierCategories.delete(supplierId);
    return [];
  }

  if (!list || list.length === 0) {
    // A supplier with no products has 0 categories until a feed is imported
    if (supplierProducts.length === 0) {
      return [];
    }

    const catMap = new Map<string, { name: string; count: number }>();

    for (const p of supplierProducts) {
      const catId = p.categoryId || 'default';
      const catName = p.categoryNameUk || 'Загальна категорія';
      const existing = catMap.get(catId) || { name: catName, count: 0 };
      existing.count += 1;
      catMap.set(catId, existing);
    }

    list = Array.from(catMap.entries()).map(([catId, info]) => ({
      id: `scat_${supplierId}_${catId}`,
      supplierId,
      feedCategoryId: catId,
      name: info.name,
      parentId: null,
      isActive: true,
      marginPercent: null,
      fixedMarkup: null,
      productCount: info.count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    state.supplierCategories.set(supplierId, list);
  }
  return list;
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

  // Cascade to products: tag availability according to category active status
  state.products = state.products.map((p) => {
    if (
      p.supplierId === supplierId &&
      (p.categoryId === target.feedCategoryId || p.categoryId === target.id)
    ) {
      return { ...p, isAvailable: isActive };
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
    if (p.supplierId === supplierId && (idSet.has(p.categoryId || '') || idSet.has(p.id))) {
      return { ...p, isAvailable: isActive };
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
