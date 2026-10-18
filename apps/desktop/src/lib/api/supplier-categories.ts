import type {
  CreateMarketplaceCategoryDto,
  UpdateMarketplaceCategoryDto,
  MarketplaceCategoryDto,
  LocalSupplierCategoryMarketplaceMapDto,
  SupplierCategoryRuleDto,
  UpdateSupplierCategoryRuleDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { fetchWithAuth } from '@/lib/api/client';

export async function getSupplierCategories(
  supplierId: string,
  token?: string,
  search?: string,
): Promise<SupplierCategoryRuleDto[]> {
  // 1. Verify active feed sources for this supplier (DB-REF-03: "Нема фіда — нема категорій")
  const feeds = await localDb.feeds.getSupplierFeedSources(supplierId);
  if (!feeds || feeds.length === 0) {
    return [];
  }

  const activeFeedIds = new Set(feeds.map((f) => f.id));

  if (isTauri()) {
    const local = await localDb.suppliers.getSupplierCategories(supplierId, search);
    return (local || []).filter((c) => !c.feedSourceId || activeFeedIds.has(c.feedSourceId));
  }

  let remoteRules: SupplierCategoryRuleDto[] = [];
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories${query}`,
      { method: 'GET' },
      token,
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) remoteRules = data;
    }
  } catch (err) {
    console.warn('[ApiClient] Remote getSupplierCategories failed, using local fallback:', err);
  }

  const localCategories = await localDb.suppliers.getSupplierCategories(supplierId, search);
  const validLocal = (localCategories || []).filter(
    (c) => !c.feedSourceId || activeFeedIds.has(c.feedSourceId),
  );

  // If we have local categories for active feeds, merge them with remote rules so we preserve real feed category names and product counts!
  if (validLocal.length > 0) {
    if (remoteRules.length === 0) return validLocal;

    const remoteMap = new Map<string, SupplierCategoryRuleDto>();
    for (const r of remoteRules) {
      remoteMap.set(r.id, r);
      if (r.feedCategoryId) remoteMap.set(r.feedCategoryId, r);
    }

    return validLocal.map((local) => {
      const match =
        remoteMap.get(local.id) ||
        remoteMap.get(local.feedCategoryId) ||
        (local.feedCategoryId
          ? remoteRules.find(
              (r) =>
                r.id.includes(local.feedCategoryId) || r.feedCategoryId === local.feedCategoryId,
            )
          : undefined);

      if (!match) return local;

      return {
        ...local,
        isActive: match.isActive ?? local.isActive,
        markupType: match.markupType ?? local.markupType,
        marginPercent: match.marginPercent ?? local.marginPercent,
        fixedMarkup: match.fixedMarkup ?? local.fixedMarkup,
        commissionPercent: match.commissionPercent ?? local.commissionPercent,
        marketplaceCategoryId: match.marketplaceCategoryId ?? local.marketplaceCategoryId,
        marketplaceCode: match.marketplaceCode ?? local.marketplaceCode,
        externalCategoryId: match.externalCategoryId ?? local.externalCategoryId,
        externalCategoryName: match.externalCategoryName ?? local.externalCategoryName,
        marketplaceMappings: {
          ...(local.marketplaceMappings || {}),
          ...(match.marketplaceMappings || {}),
        },
      };
    });
  }

  return [];
}

export async function toggleSupplierCategory(
  supplierId: string,
  categoryId: string,
  isActive: boolean,
  token?: string,
): Promise<SupplierCategoryRuleDto> {
  if (isTauri()) {
    return localDb.suppliers.toggleSupplierCategory(supplierId, categoryId, isActive);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories/${categoryId}/toggle`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      },
      token,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[ApiClient] Remote toggleSupplierCategory failed, using local fallback:', err);
  }

  return localDb.suppliers.toggleSupplierCategory(supplierId, categoryId, isActive);
}

export async function batchToggleSupplierCategories(
  supplierId: string,
  categoryIds: string[],
  isActive: boolean,
  token?: string,
): Promise<{ updatedCount: number }> {
  if (isTauri()) {
    return localDb.suppliers.batchToggleSupplierCategories(supplierId, categoryIds, isActive);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories/batch-toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds, isActive }),
      },
      token,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(
      '[ApiClient] Remote batchToggleSupplierCategories failed, using local fallback:',
      err,
    );
  }

  return localDb.suppliers.batchToggleSupplierCategories(supplierId, categoryIds, isActive);
}

export async function updateSupplierCategoryRule(
  supplierId: string,
  categoryId: string,
  payload: UpdateSupplierCategoryRuleDto,
  token?: string,
): Promise<SupplierCategoryRuleDto> {
  if (isTauri()) {
    return localDb.suppliers.updateSupplierCategoryRule(supplierId, categoryId, payload);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories/${categoryId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token,
    );
    if (response.ok) {
      const updated = await response.json();
      try {
        await localDb.suppliers.updateSupplierCategoryRule(supplierId, categoryId, payload);
      } catch (localErr) {
        console.warn('[ApiClient] Local sync on updateSupplierCategoryRule skipped:', localErr);
      }
      return updated;
    }
  } catch (err) {
    console.warn(
      '[ApiClient] Remote updateSupplierCategoryRule failed, using local fallback:',
      err,
    );
  }

  return localDb.suppliers.updateSupplierCategoryRule(supplierId, categoryId, payload);
}

export async function getMarketplaceCategories(
  marketplaceCode?: string,
  search?: string,
  _token?: string,
): Promise<MarketplaceCategoryDto[]> {
  return localDb.suppliers.getMarketplaceCategories(marketplaceCode, search);
}

export async function createMarketplaceCategory(
  payload: CreateMarketplaceCategoryDto,
  _token?: string,
): Promise<MarketplaceCategoryDto> {
  return localDb.suppliers.createMarketplaceCategory(payload);
}

export async function updateMarketplaceCategory(
  id: string,
  payload: UpdateMarketplaceCategoryDto,
  _token?: string,
): Promise<MarketplaceCategoryDto> {
  return localDb.suppliers.updateMarketplaceCategory(id, payload);
}

export async function importMarketplaceCategories(
  items: CreateMarketplaceCategoryDto[],
  _token?: string,
): Promise<{ importedCount: number }> {
  return localDb.suppliers.importMarketplaceCategories(items);
}

export async function autoMapSupplierCategories(
  supplierId: string,
  marketplaceCode = 'ROZETKA',
  _token?: string,
): Promise<{ mappedCount: number; categories: SupplierCategoryRuleDto[] }> {
  return localDb.suppliers.autoMapSupplierCategories(supplierId, marketplaceCode);
}

export async function getSupplierCategoryMarketplaceMaps(
  supplierCategoryRuleId?: string,
): Promise<LocalSupplierCategoryMarketplaceMapDto[]> {
  return localDb.suppliers.getSupplierCategoryMarketplaceMaps(supplierCategoryRuleId);
}

export async function upsertSupplierCategoryMarketplaceMap(
  payload: Partial<LocalSupplierCategoryMarketplaceMapDto> & {
    supplierCategoryRuleId: string;
    marketplaceCode: string;
    externalCategoryId: string;
    externalCategoryName: string;
  },
): Promise<LocalSupplierCategoryMarketplaceMapDto> {
  return localDb.suppliers.upsertSupplierCategoryMarketplaceMap(payload);
}

export async function deleteSupplierCategoryMarketplaceMap(
  supplierCategoryRuleId: string,
  marketplaceCode: string,
): Promise<void> {
  return localDb.suppliers.deleteSupplierCategoryMarketplaceMap(
    supplierCategoryRuleId,
    marketplaceCode,
  );
}
