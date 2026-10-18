import {
  type MarketplaceCategoryDto,
  type CreateMarketplaceCategoryDto,
  type SupplierCategoryRuleDto,
  type LocalSupplierCategoryMarketplaceMapDto,
  SEED_MARKETPLACE_CATEGORIES,
  parseMarketplaceCategoryUrl,
  suggestMarketplaceCategory,
} from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';
import { ensureSupplierCategories } from '@/services/local-db/mock/mock-supplier-categories';
import { getCurrentStorageUserId } from '@/services/local-db/mock/mock-storage';

export function ensureMarketplaceCategories(state: MockDbState): MarketplaceCategoryDto[] {
  const currentUserId = getCurrentStorageUserId() || 'usr_admin';
  if (!state.marketplaceCategories || state.marketplaceCategories.length === 0) {
    state.marketplaceCategories = SEED_MARKETPLACE_CATEGORIES.map((c) => ({
      ...c,
      userId: currentUserId,
    }));
    return state.marketplaceCategories;
  }

  // Ensure all seed categories are present while preserving user-added or edited ones
  const existingKeys = new Set(
    state.marketplaceCategories.map((c) => `${c.marketplaceCode}::${c.externalId}`),
  );
  for (const seed of SEED_MARKETPLACE_CATEGORIES) {
    const key = `${seed.marketplaceCode}::${seed.externalId}`;
    if (!existingKeys.has(key)) {
      state.marketplaceCategories.push({ ...seed, userId: currentUserId });
    }
  }
  return state.marketplaceCategories;
}

export function getMarketplaceCategories(
  state: MockDbState,
  marketplaceCode?: string,
  search?: string,
): MarketplaceCategoryDto[] {
  let list = ensureMarketplaceCategories(state).filter((c) => c.isActive !== false);

  if (marketplaceCode && marketplaceCode !== 'ALL') {
    const mp = marketplaceCode.toUpperCase();
    list = list.filter((c) => c.marketplaceCode.toUpperCase() === mp);
  }

  if (search && search.trim()) {
    const raw = search.trim();
    const parsedUrl = parseMarketplaceCategoryUrl(raw, marketplaceCode || 'ROZETKA');
    const q = (parsedUrl?.externalId || raw).toLowerCase();

    list = list.filter(
      (c) =>
        c.nameUk.toLowerCase().includes(q) ||
        c.externalId.toLowerCase().includes(q) ||
        (c.fullPathUk && c.fullPathUk.toLowerCase().includes(q)) ||
        (c.nameEn && c.nameEn.toLowerCase().includes(q)),
    );
  }

  return list;
}

export function createMarketplaceCategory(
  state: MockDbState,
  payload: CreateMarketplaceCategoryDto,
): MarketplaceCategoryDto {
  const list = ensureMarketplaceCategories(state);
  const rawMarketplace = (payload.marketplaceCode || 'ROZETKA').toUpperCase();
  const parsed = parseMarketplaceCategoryUrl(payload.externalId, rawMarketplace);

  const marketplaceCode = parsed?.marketplaceCode || rawMarketplace;
  const externalId = parsed?.externalId || payload.externalId.trim();
  const attrMap: Record<string, string> = {
    ROZETKA: 'rz_id',
    PROM: 'portal_id',
    EPICENTR: 'category_code',
    ALLO: 'allo_id',
    KASTA: 'kasta_id',
  };
  const xmlAttributeName =
    payload.xmlAttributeName || parsed?.xmlAttributeName || attrMap[marketplaceCode] || 'rz_id';
  const url = payload.url || parsed?.extractedUrl || null;
  const now = new Date().toISOString();

  const existingIdx = list.findIndex(
    (c) =>
      c.marketplaceCode.toUpperCase() === marketplaceCode &&
      c.externalId.toLowerCase() === externalId.toLowerCase(),
  );

  const item: MarketplaceCategoryDto = {
    id:
      existingIdx >= 0
        ? list[existingIdx].id
        : `mcat_${marketplaceCode.toLowerCase()}_${externalId}`,
    userId: getCurrentStorageUserId() || 'usr_admin',
    marketplaceCode,
    externalId,
    xmlAttributeName,
    nameUk: payload.nameUk.trim(),
    nameEn: payload.nameEn ?? null,
    fullPathUk: payload.fullPathUk ?? null,
    url,
    defaultCommissionPercent: Number(payload.defaultCommissionPercent ?? 0),
    defaultFixedFee: Number(payload.defaultFixedFee ?? 0),
    isLeaf: true,
    isActive: true,
    createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = item;
  } else {
    list.unshift(item);
  }

  return item;
}

export function autoMapSupplierCategories(
  state: MockDbState,
  supplierId: string,
  marketplaceCode = 'ROZETKA',
): { mappedCount: number; categories: SupplierCategoryRuleDto[] } {
  const catalog = ensureMarketplaceCategories(state);
  const categories = ensureSupplierCategories(state, supplierId);
  const mp = marketplaceCode.toUpperCase();
  let mappedCount = 0;

  for (const cat of categories) {
    const matched = suggestMarketplaceCategory(cat.name, catalog, mp);
    if (matched) {
      const mappings = { ...(cat.marketplaceMappings || {}) };
      mappings[mp] = {
        marketplaceCode: mp,
        marketplaceCategoryId: matched.id,
        externalCategoryId: matched.externalId,
        externalCategoryName: matched.nameUk,
        commissionPercent: matched.defaultCommissionPercent,
        fixedFee: matched.defaultFixedFee,
      };
      cat.marketplaceMappings = mappings;
      cat.marketplaceCategoryId = matched.id;
      cat.marketplaceCode = mp;
      cat.externalCategoryId = matched.externalId;
      cat.externalCategoryName = matched.nameUk;
      cat.commissionPercent = matched.defaultCommissionPercent;
      cat.updatedAt = new Date().toISOString();
      mappedCount += 1;
    }
  }

  return { mappedCount, categories };
}

export function updateMarketplaceCategory(
  state: MockDbState,
  id: string,
  patch: Partial<CreateMarketplaceCategoryDto>,
): MarketplaceCategoryDto {
  const list = ensureMarketplaceCategories(state);
  const target = list.find((c) => c.id === id || c.externalId === id);
  if (!target) {
    throw new Error(`Категорію маркетплейсу ${id} не знайдено`);
  }

  if (patch.nameUk !== undefined) target.nameUk = patch.nameUk.trim();
  if (patch.externalId !== undefined) {
    const parsed = parseMarketplaceCategoryUrl(patch.externalId, target.marketplaceCode);
    target.externalId = parsed?.externalId || patch.externalId.trim();
    if (parsed?.extractedUrl) target.url = parsed.extractedUrl;
  }
  if (patch.defaultCommissionPercent !== undefined) {
    target.defaultCommissionPercent = Number(patch.defaultCommissionPercent);
  }
  if (patch.url !== undefined) target.url = patch.url;
  if (patch.fullPathUk !== undefined) target.fullPathUk = patch.fullPathUk;
  target.updatedAt = new Date().toISOString();

  // Cascade update all supplier categories mapped to this category
  for (const [, catList] of state.supplierCategories.entries()) {
    for (const sc of catList) {
      if (sc.marketplaceCategoryId === target.id || sc.externalCategoryId === target.externalId) {
        sc.externalCategoryId = target.externalId;
        sc.externalCategoryName = target.nameUk;
        sc.commissionPercent = target.defaultCommissionPercent;
        if (sc.marketplaceMappings?.[target.marketplaceCode]) {
          sc.marketplaceMappings[target.marketplaceCode].externalCategoryId = target.externalId;
          sc.marketplaceMappings[target.marketplaceCode].externalCategoryName = target.nameUk;
          sc.marketplaceMappings[target.marketplaceCode].commissionPercent =
            target.defaultCommissionPercent;
        }
        sc.updatedAt = new Date().toISOString();
      }
    }
  }

  return target;
}

export function importMarketplaceCategories(
  state: MockDbState,
  items: CreateMarketplaceCategoryDto[],
): { importedCount: number } {
  let count = 0;
  for (const item of items) {
    if (item.nameUk && item.externalId) {
      createMarketplaceCategory(state, item);
      count++;
    }
  }
  return { importedCount: count };
}

export function getSupplierCategoryMarketplaceMaps(
  state: MockDbState,
  supplierCategoryRuleId?: string,
): LocalSupplierCategoryMarketplaceMapDto[] {
  if (supplierCategoryRuleId) {
    return state.supplierCategoryMarketplaceMaps.get(supplierCategoryRuleId) || [];
  }
  const all: LocalSupplierCategoryMarketplaceMapDto[] = [];
  for (const list of state.supplierCategoryMarketplaceMaps.values()) {
    all.push(...list);
  }
  return all;
}

export function upsertSupplierCategoryMarketplaceMap(
  state: MockDbState,
  payload: Partial<LocalSupplierCategoryMarketplaceMapDto> & {
    supplierCategoryRuleId: string;
    marketplaceCode: string;
    externalCategoryId: string;
    externalCategoryName: string;
  },
): LocalSupplierCategoryMarketplaceMapDto {
  const userId = getCurrentStorageUserId() || 'usr_admin';
  const list = state.supplierCategoryMarketplaceMaps.get(payload.supplierCategoryRuleId) || [];
  const mpCode = payload.marketplaceCode.toUpperCase();
  const existingIdx = list.findIndex((m) => m.marketplaceCode.toUpperCase() === mpCode);
  const now = new Date().toISOString();

  const item: LocalSupplierCategoryMarketplaceMapDto = {
    id:
      payload.id ||
      (existingIdx >= 0
        ? list[existingIdx].id
        : `scmm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
    userId,
    supplierCategoryRuleId: payload.supplierCategoryRuleId,
    marketplaceCode: mpCode,
    marketplaceCategoryId: payload.marketplaceCategoryId ?? null,
    externalCategoryId: payload.externalCategoryId,
    externalCategoryName: payload.externalCategoryName,
    commissionPercent: Number(payload.commissionPercent ?? 0),
    fixedFee: Number(payload.fixedFee ?? 0),
    createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = item;
  } else {
    list.push(item);
  }
  state.supplierCategoryMarketplaceMaps.set(payload.supplierCategoryRuleId, list);
  return item;
}

export function deleteSupplierCategoryMarketplaceMap(
  state: MockDbState,
  supplierCategoryRuleId: string,
  marketplaceCode: string,
): void {
  const list = state.supplierCategoryMarketplaceMaps.get(supplierCategoryRuleId);
  if (!list) return;
  const filtered = list.filter(
    (m) => m.marketplaceCode.toUpperCase() !== marketplaceCode.toUpperCase(),
  );
  state.supplierCategoryMarketplaceMaps.set(supplierCategoryRuleId, filtered);
}

export { buildDefaultCategoryMappings } from '@/services/local-db/mock/mock-category-mapping-builder';
