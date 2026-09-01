import type { FeedSourceDto, CategorySummaryDto } from '@smartfeed/shared';
import { FeedFormat, FeedSourceType } from '@smartfeed/shared';
import type { RawParsedProduct } from '../feed-engine/stream-parser';
import { feedEngine } from '../feed-engine';
import { invokeLocalDb } from './client';

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
    const feedSourceId =
      options.feedSourceId || `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const result = await feedEngine.ingest(options.supplierId, rawProducts, feedSourceId);

    // Save or update feed source record using universal DB invoke
    const payload = {
      name:
        options.fileName || options.sourceUrl || `Фід ${new Date().toLocaleDateString('uk-UA')}`,
      sourceType:
        options.sourceType || (options.sourceUrl ? FeedSourceType.URL : FeedSourceType.FILE),
      format: FeedFormat.XML_ROZETKA,
      url: options.sourceUrl,
      syncIntervalHours: 24,
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      autoCreateNewProducts: true,
      productsCount: result.createdCount,
    };

    const dbResult = await invokeLocalDb('db_create_feed_source', {
      supplierId: options.supplierId,
      payload,
    });

    return {
      totalProcessed: dbResult.totalProcessed,
      createdCount: dbResult.createdCount,
      feedSourceId: dbResult.feedSourceId,
    };
  }

  async getSupplierFeedSources(supplierId: string): Promise<FeedSourceDto[]> {
    return invokeLocalDb('db_get_supplier_feed_sources', { supplierId });
  }

  async getAllFeedSources(): Promise<FeedSourceDto[]> {
    return invokeLocalDb('db_get_all_feed_sources', {});
  }

  async deleteSupplierFeedSource(_supplierId: string, _sourceId: string): Promise<boolean> {
    console.warn('deleteSupplierFeedSource not fully implemented yet');
    return true;
  }
}

export const localFeedsService = new LocalFeedsService();

if (typeof window !== 'undefined') {
  (window as unknown as { __LOCAL_FEEDS_SERVICE__?: LocalFeedsService }).__LOCAL_FEEDS_SERVICE__ =
    localFeedsService;
}
