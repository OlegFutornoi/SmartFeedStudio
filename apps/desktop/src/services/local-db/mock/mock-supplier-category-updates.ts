import {
  type SupplierCategoryRuleDto,
  type UpdateSupplierCategoryRuleDto,
} from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';
import { ensureSupplierCategories } from '@/services/local-db/mock/mock-supplier-categories';

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
  marginOrPayload?: number | null | UpdateSupplierCategoryRuleDto,
  fixedMarkup?: number | null,
): SupplierCategoryRuleDto {
  const list = ensureSupplierCategories(state, supplierId);
  const target = list.find((c) => c.id === categoryId || c.feedCategoryId === categoryId);
  if (!target) {
    throw new Error(`Категорія ${categoryId} не знайдена у постачальника`);
  }

  const payload: UpdateSupplierCategoryRuleDto =
    typeof marginOrPayload === 'object' && marginOrPayload !== null
      ? marginOrPayload
      : { marginPercent: marginOrPayload, fixedMarkup };

  if (
    payload.markupType === 'FIXED' ||
    (payload.fixedMarkup !== undefined &&
      payload.markupType !== 'PERCENT' &&
      payload.marginPercent === undefined)
  ) {
    target.markupType = 'FIXED';
    if (payload.fixedMarkup !== undefined)
      target.fixedMarkup = payload.fixedMarkup !== null ? Number(payload.fixedMarkup) : null;
    target.marginPercent = null;
  } else if (
    payload.markupType === 'PERCENT' ||
    (payload.marginPercent !== undefined &&
      payload.markupType !== 'FIXED' &&
      payload.fixedMarkup === undefined)
  ) {
    target.markupType = 'PERCENT';
    if (payload.marginPercent !== undefined)
      target.marginPercent = payload.marginPercent !== null ? Number(payload.marginPercent) : null;
    target.fixedMarkup = null;
  } else {
    if (payload.markupType !== undefined) target.markupType = payload.markupType;
    if (payload.marginPercent !== undefined)
      target.marginPercent = payload.marginPercent !== null ? Number(payload.marginPercent) : null;
    if (payload.fixedMarkup !== undefined)
      target.fixedMarkup = payload.fixedMarkup !== null ? Number(payload.fixedMarkup) : null;
  }

  if (payload.name && !payload.name.startsWith('scat_')) target.name = payload.name;
  if (payload.feedCategoryId && !payload.feedCategoryId.startsWith('scat_'))
    target.feedCategoryId = payload.feedCategoryId;
  if (payload.feedSourceId !== undefined) target.feedSourceId = payload.feedSourceId;
  if (payload.feedName !== undefined) target.feedName = payload.feedName;
  if (payload.productCount !== undefined) target.productCount = payload.productCount;
  if (payload.commissionPercent !== undefined) {
    target.commissionPercent =
      payload.commissionPercent !== null ? Number(payload.commissionPercent) : null;
  }
  if (payload.marketplaceCategoryId !== undefined)
    target.marketplaceCategoryId = payload.marketplaceCategoryId;
  if (payload.marketplaceCode !== undefined) target.marketplaceCode = payload.marketplaceCode;
  if (payload.externalCategoryId !== undefined)
    target.externalCategoryId = payload.externalCategoryId;
  if (payload.externalCategoryName !== undefined)
    target.externalCategoryName = payload.externalCategoryName;

  const mpCode = (payload.marketplaceCode || target.marketplaceCode || 'ROZETKA').toUpperCase();
  const extId =
    payload.externalCategoryId ?? target.marketplaceMappings?.[mpCode]?.externalCategoryId;
  const extName =
    payload.externalCategoryName ?? target.marketplaceMappings?.[mpCode]?.externalCategoryName;

  if (extId && extName) {
    const mappings = { ...(target.marketplaceMappings || {}) };
    mappings[mpCode] = {
      marketplaceCode: mpCode,
      marketplaceCategoryId:
        payload.marketplaceCategoryId ?? mappings[mpCode]?.marketplaceCategoryId ?? null,
      externalCategoryId: extId,
      externalCategoryName: extName,
      commissionPercent: Number(
        payload.commissionPercent ??
          mappings[mpCode]?.commissionPercent ??
          target.commissionPercent ??
          0,
      ),
      fixedFee: mappings[mpCode]?.fixedFee ?? 0,
    };
    target.marketplaceMappings = mappings;
  }

  target.updatedAt = new Date().toISOString();
  return target;
}
