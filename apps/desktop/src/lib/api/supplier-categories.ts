import type { SupplierCategoryRuleDto, UpdateSupplierCategoryRuleDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { getSupplierFeedSources } from '@/lib/api/feed-sources';
import { invalidateSuppliersCache } from '@/lib/api/suppliers';
import { appCounterService } from '@/services/counters';

export * from '@/lib/api/marketplace-categories';

export async function getSupplierCategories(
  supplierId: string,
  _token?: string,
  search?: string,
): Promise<SupplierCategoryRuleDto[]> {
  const feeds = await getSupplierFeedSources(supplierId);
  const hasActiveFeeds = Boolean(feeds && feeds.length > 0);
  const activeFeedIds = hasActiveFeeds ? new Set(feeds.map((f) => f.id)) : null;
  const activeFeedNames = hasActiveFeeds ? new Set(feeds.map((f) => f.name)) : null;
  const isFeedActive = (c: SupplierCategoryRuleDto) => {
    if (!activeFeedIds || !activeFeedNames) return true;
    return Boolean(
      !c.feedSourceId ||
      activeFeedIds.has(c.feedSourceId) ||
      (c.feedName && activeFeedNames.has(c.feedName)),
    );
  };

  const local = await localDb.suppliers.getSupplierCategories(supplierId, search);
  return (local || []).filter(isFeedActive);
}

export async function toggleSupplierCategory(
  supplierId: string,
  categoryId: string,
  isActive: boolean,
  _token?: string,
): Promise<SupplierCategoryRuleDto> {
  invalidateSuppliersCache();
  appCounterService.invalidate();
  return localDb.suppliers.toggleSupplierCategory(supplierId, categoryId, isActive);
}

export async function batchToggleSupplierCategories(
  supplierId: string,
  categoryIds: string[],
  isActive: boolean,
  _token?: string,
): Promise<{ updatedCount: number }> {
  invalidateSuppliersCache();
  appCounterService.invalidate();
  return localDb.suppliers.batchToggleSupplierCategories(supplierId, categoryIds, isActive);
}

export async function updateSupplierCategoryRule(
  supplierId: string,
  categoryId: string,
  payload: UpdateSupplierCategoryRuleDto,
  _token?: string,
): Promise<SupplierCategoryRuleDto> {
  return localDb.suppliers.updateSupplierCategoryRule(supplierId, categoryId, payload);
}

export async function bulkUpsertSupplierCategories(
  _supplierId: string,
  _categories: Array<{
    feedCategoryId: string;
    name: string;
    parentId?: string | null;
    feedSourceId?: string | null;
    feedName?: string | null;
    productCount?: number;
    isActive?: boolean;
  }>,
  _token?: string,
): Promise<SupplierCategoryRuleDto[]> {
  invalidateSuppliersCache();
  appCounterService.invalidate();
  return [];
}

export async function deleteSupplierCategory(
  _supplierId: string,
  categoryId: string,
  _token?: string,
): Promise<{ success: boolean; id: string }> {
  invalidateSuppliersCache();
  appCounterService.invalidate();
  return { success: true, id: categoryId };
}
