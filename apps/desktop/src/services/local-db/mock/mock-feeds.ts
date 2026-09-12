import type { FeedSourceDto } from '@smartfeed/shared';
import { FeedFormat, FeedSourceType } from '@smartfeed/shared';
import { formatFeedTitle } from '@/lib/formatters';
import type { MockDbState } from './mock-state';
import { syncCounters } from './mock-state';
import { getSupplierById } from './mock-suppliers';

export interface CreateFeedSourcePayload {
  id?: string;
  name?: string;
  sourceType?: FeedSourceType;
  format?: FeedFormat;
  url?: string;
  syncIntervalHours?: number;
  autoUpdatePrices?: boolean;
  autoUpdateStocks?: boolean;
  autoCreateNewProducts?: boolean;
  productsCount?: number;
}

export function getSupplierFeedSources(state: MockDbState, supplierId: string): FeedSourceDto[] {
  return state.feedSources.get(supplierId) || [];
}

export function getAllFeedSources(state: MockDbState): FeedSourceDto[] {
  const all: FeedSourceDto[] = [];
  for (const sources of state.feedSources.values()) {
    all.push(...sources);
  }
  return all;
}

export function createFeedSource(
  state: MockDbState,
  supplierId: string,
  payload: CreateFeedSourcePayload,
): { totalProcessed: number; createdCount: number; feedSourceId: string } {
  const feedSourceId = payload.id || `feed_${Math.random().toString(36).substring(2, 11)}`;
  const supplierSources = state.feedSources.get(supplierId) || [];

  const sourceRecord: FeedSourceDto = {
    id: feedSourceId,
    supplierId,
    name: formatFeedTitle(payload.name, payload.url) || 'Оновлений прайс-лист',
    sourceType: payload.sourceType || FeedSourceType.URL,
    fileFormat: payload.format || FeedFormat.XML_ROZETKA,
    sourceUrl: payload.url,
    syncIntervalHours: payload.syncIntervalHours || 24,
    autoUpdatePrices: payload.autoUpdatePrices ?? true,
    autoUpdateStocks: payload.autoUpdateStocks ?? true,
    autoCreateNewProducts: payload.autoCreateNewProducts ?? true,
    productsCount: payload.productsCount || 0,
    lastSyncedAt: new Date().toISOString(),
    lastSyncStatus: 'SUCCESS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  supplierSources.unshift(sourceRecord);
  state.feedSources.set(supplierId, supplierSources);

  const supplier = getSupplierById(state, supplierId);
  if (supplier) {
    supplier.activeFeedsCount = supplierSources.length;
  }

  return {
    totalProcessed: payload.productsCount || 0,
    createdCount: payload.productsCount || 0,
    feedSourceId,
  };
}

export function deleteFeedSource(
  state: MockDbState,
  supplierId: string,
  sourceId: string,
  deleteProducts = true,
): { success: boolean; deletedProductsCount: number } {
  let deletedProductsCount = 0;

  // 1. Remove from supplier sources
  const supplierSources = state.feedSources.get(supplierId) || [];
  const filtered = supplierSources.filter((s) => s.id !== sourceId);
  state.feedSources.set(supplierId, filtered);

  // Also check other suppliers in case sourceId belongs to another supplier
  for (const [supId, sources] of state.feedSources.entries()) {
    if (supId !== supplierId) {
      const remaining = sources.filter((s) => s.id !== sourceId);
      if (remaining.length !== sources.length) {
        state.feedSources.set(supId, remaining);
        const sup = getSupplierById(state, supId);
        if (sup) sup.activeFeedsCount = remaining.length;
      }
    }
  }

  const supplier = getSupplierById(state, supplierId);
  if (supplier) {
    supplier.activeFeedsCount = filtered.length;
  }

  // 2. Remove associated products and images if requested
  if (deleteProducts) {
    const initialCount = state.products.length;
    const deletedProductIds = new Set<string>();

    state.products = state.products.filter((p) => {
      const pFeedSourceId =
        (p as unknown as { feedSourceId?: string; feed_source_id?: string }).feedSourceId ||
        (p as unknown as { feedSourceId?: string; feed_source_id?: string }).feed_source_id;

      if (pFeedSourceId === sourceId) {
        deletedProductIds.add(p.id);
        return false;
      }
      return true;
    });

    deletedProductsCount = initialCount - state.products.length;

    // Update global and supplier product counters
    syncCounters(state);
    if (supplier) {
      supplier.productsCount = state.products.filter((p) => p.supplierId === supplierId).length;
    }
  }

  return {
    success: true,
    deletedProductsCount,
  };
}
