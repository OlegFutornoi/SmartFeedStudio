import type { FeedSourceDto, CategorySummaryDto } from '@smartfeed/shared';
import { FeedFormat, FeedSourceType } from '@smartfeed/shared';
import { formatFeedTitle } from '@/lib/formatters';
import type { RawParsedProduct } from '@/services/feed-engine/stream-parser';
import { feedEngine } from '@/services/feed-engine';
import { invokeLocalDb } from '@/services/local-db/client';

export interface AnalyzeFeedResult {
  format: string;
  categories: CategorySummaryDto[];
  totalProducts: number;
  sampleCategories: Array<{ externalId: string; parentId?: string; name: string }>;
  sampleProducts: RawParsedProduct[];
}

export class LocalFeedsService {
  constructor() {}

  /**
   * Analyzes an XML / CSV / XLSX feed stream or file content locally
   */
  async analyzeFeed(content: string, supplierId?: string): Promise<AnalyzeFeedResult> {
    const analysis = feedEngine.analyze(content, supplierId);

    return {
      format: analysis.format,
      categories: analysis.categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        productCount: c.productCount,
      })),
      totalProducts: analysis.totalDetected,
      sampleCategories: analysis.sampleCategories,
      sampleProducts: analysis.sampleProducts,
    };
  }

  /**
   * Imports parsed feed products directly into local database
   */
  async importFeedContent(
    content: string,
    options: {
      supplierId: string;
      selectedCategoryIds?: string[];
      feedSourceId?: string;
      sourceUrl?: string;
      fileName?: string;
      sourceType?: FeedSourceType;
    },
  ): Promise<{ totalProcessed: number; createdCount: number; feedSourceId: string }> {
    const rawProducts = feedEngine.parseProducts(content, options);

    // 1. INVARIANT: "Нема фіда — нема товарів". Register the parent FeedSource record first.
    const payload = {
      id: options.feedSourceId,
      name:
        options.fileName ||
        (options.sourceUrl
          ? formatFeedTitle(options.sourceUrl)
          : `Фід ${new Date().toLocaleDateString('uk-UA')}`),
      sourceType:
        options.sourceType || (options.sourceUrl ? FeedSourceType.URL : FeedSourceType.FILE),
      format: FeedFormat.XML_ROZETKA,
      url: options.sourceUrl,
      syncIntervalHours: 24,
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      autoCreateNewProducts: true,
      productsCount: rawProducts.length,
    };

    let dbResult: { totalProcessed: number; createdCount: number; feedSourceId: string };
    try {
      dbResult = await invokeLocalDb('db_create_feed_source', {
        supplierId: options.supplierId,
        payload,
      });
    } catch (createErr) {
      console.error(
        '[LocalFeedsService] Failed to create feed source before product ingest:',
        createErr,
      );
      throw createErr;
    }

    const actualFeedSourceId = dbResult.feedSourceId;

    // 2. Ingest products linked strictly to the created/deduplicated feedSourceId.
    try {
      const result = await feedEngine.ingest(options.supplierId, rawProducts, actualFeedSourceId);
      return {
        totalProcessed: result.totalProcessed,
        createdCount: result.createdCount,
        feedSourceId: actualFeedSourceId,
      };
    } catch (ingestErr) {
      // Rollback: if product ingestion fails, delete the created feed source and all its products
      console.error(
        '[LocalFeedsService] Ingestion failed, rolling back feed source and partial products:',
        ingestErr,
      );
      await invokeLocalDb('db_delete_feed_source', {
        supplierId: options.supplierId,
        id: actualFeedSourceId,
        deleteProducts: true,
      }).catch((rollbackErr) => console.warn('[LocalFeedsService] Rollback error:', rollbackErr));
      throw ingestErr;
    }
  }

  async getSupplierFeedSources(supplierId: string): Promise<FeedSourceDto[]> {
    return invokeLocalDb('db_get_supplier_feed_sources', { supplierId });
  }

  async getAllFeedSources(): Promise<FeedSourceDto[]> {
    return invokeLocalDb('db_get_all_feed_sources', {});
  }

  async deleteSupplierFeedSource(
    supplierId: string,
    sourceId: string,
    deleteProducts = true,
  ): Promise<{ success: boolean; deletedProductsCount: number }> {
    return invokeLocalDb('db_delete_feed_source', {
      supplierId,
      id: sourceId,
      deleteProducts,
    });
  }
}

export const localFeedsService = new LocalFeedsService();

if (typeof window !== 'undefined') {
  (window as unknown as { __LOCAL_FEEDS_SERVICE__?: LocalFeedsService }).__LOCAL_FEEDS_SERVICE__ =
    localFeedsService;
}
