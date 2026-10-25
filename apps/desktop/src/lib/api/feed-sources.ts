import type { FeedSourceDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { emitDataSync } from '@/lib/syncEvents';
import { feedEngine } from '@/services/feed-engine';
import { fetchFeedContent } from '@/lib/api/feeds-mutations';
import { cleanupStorageOrphans } from '@/services/storage';
import { FeedSourceItemDto, mapLocalFeedSource } from '@/lib/api/feed-sources-types';

export type { FeedSourceItemDto };

export async function getSupplierFeedSources(
  supplierId: string,
  _token?: string,
): Promise<FeedSourceItemDto[]> {
  try {
    const sources = await localDb.feeds.getSupplierFeedSources(supplierId);
    return (sources || []).map(mapLocalFeedSource);
  } catch (err) {
    console.warn('[feed-sources] localDb lookup failed:', err);
    return [];
  }
}

export async function getAllFeedSources(_token?: string): Promise<FeedSourceItemDto[]> {
  try {
    const sources = await localDb.feeds.getAllFeedSources();
    return (sources || []).map(mapLocalFeedSource);
  } catch (err) {
    console.warn('[feed-sources] localDb getAllFeedSources failed:', err);
    return [];
  }
}

export async function syncSupplierFeedSource(
  supplierId: string,
  sourceId: string,
  token?: string,
): Promise<{ success: boolean; jobId: string; updatedCount?: number }> {
  try {
    const sources = await localDb.feeds.getSupplierFeedSources(supplierId);
    const feed = sources.find((s) => s.id === sourceId);

    if (feed && feed.sourceUrl) {
      const content = await fetchFeedContent(feed.sourceUrl, token);
      const rawProducts = feedEngine.parseProducts(content, { supplierId });
      const ingestResult = await feedEngine.ingest(supplierId, rawProducts, feed.id);
      emitDataSync(['products', 'feeds', 'suppliers', 'quotas', 'all']);

      return {
        success: true,
        jobId: `sync_${Date.now()}`,
        updatedCount: ingestResult.createdCount,
      };
    }
  } catch (localErr) {
    console.warn('[feed-sources:syncSupplierFeedSource] Local sync error:', localErr);
    throw localErr;
  }

  return { success: true, jobId: `job_${Date.now()}` };
}

export async function deleteSupplierFeedSource(
  supplierId: string,
  sourceId: string,
  token?: string,
  deleteProducts = true,
): Promise<{ success: boolean; deletedProductsCount?: number }> {
  if (deleteProducts && token) {
    try {
      const allProds = await localDb.products.getProducts({ limit: 10000 });
      const remainingKeys: string[] = [];
      for (const prod of allProds.items || []) {
        const pFeedSourceId =
          (prod as unknown as { feedSourceId?: string; feed_source_id?: string }).feedSourceId ||
          (prod as unknown as { feedSourceId?: string; feed_source_id?: string }).feed_source_id;
        if (pFeedSourceId !== sourceId && prod.supplierId !== supplierId) {
          for (const img of prod.images || []) {
            if (img.s3Key) remainingKeys.push(img.s3Key);
          }
        }
      }
      await cleanupStorageOrphans(token, {
        dryRun: false,
        folder: 'images',
        activeKeys: remainingKeys,
      });
    } catch (err) {
      console.warn('[deleteSupplierFeedSource] Failed to cascade purge R2 images:', err);
    }
  }

  const localResult = await localDb.feeds.deleteSupplierFeedSource(
    supplierId,
    sourceId,
    deleteProducts,
  );

  emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'storage', 'all']);

  return {
    success: true,
    deletedProductsCount: localResult.deletedProductsCount || 0,
  };
}
export * from '@/lib/api/feed-sources-import';

export async function updateSupplierFeedSource(
  _supplierId: string,
  sourceId: string,
  dto: Partial<FeedSourceDto>,
  _token?: string,
): Promise<FeedSourceItemDto> {
  const updated = await localDb.feeds.updateFeedSource(sourceId, dto);
  emitDataSync('feeds');
  return mapLocalFeedSource(updated);
}
