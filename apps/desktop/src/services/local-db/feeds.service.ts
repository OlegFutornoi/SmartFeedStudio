import type { FeedSourceDto, CategorySummaryDto } from '@smartfeed/shared';
import { FeedFormat, FeedSourceType } from '@smartfeed/shared';
import { feedEngine } from '../feed-engine';
import { mockDatabaseDriver } from './mock-driver';

export interface AnalyzeFeedResult {
  format: string;
  categories: CategorySummaryDto[];
  totalProducts: number;
  sampleCategories: Array<{ externalId: string; parentId?: string; name: string }>;
  sampleProducts: any[];
}

export class LocalFeedsService {
  private feedSources: Map<string, FeedSourceDto[]> = new Map();

  constructor() {
    this.checkAndSeedIfEnabled();
  }

  public checkAndSeedIfEnabled(): void {
    if (
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('smartfeed_e2e_seed') === 'true'
    ) {
      this.seedDefaultData();
    }
  }

  public reset(): void {
    this.feedSources.clear();
    this.checkAndSeedIfEnabled();
  }

  public seedDefaultData(): void {
    this.feedSources.set('sup_demo_01', [
      {
        id: 'feed_demo_01',
        supplierId: 'sup_demo_01',
        name: 'Основний XML прайс (Rozetka)',
        sourceType: FeedSourceType.URL,
        fileFormat: FeedFormat.XML_ROZETKA,
        sourceUrl: 'https://supplier.com/feeds/price.xml',
        syncIntervalHours: 24,
        autoUpdatePrices: true,
        autoUpdateStocks: true,
        autoCreateNewProducts: true,
        productsCount: 15,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'feed_demo_02',
        supplierId: 'sup_demo_01',
        name: 'Prom.ua Експортний фід',
        sourceType: FeedSourceType.URL,
        fileFormat: FeedFormat.XML_ROZETKA,
        sourceUrl: 'https://supplier.com/feeds/prom.xml',
        syncIntervalHours: 24,
        autoUpdatePrices: true,
        autoUpdateStocks: true,
        autoCreateNewProducts: true,
        productsCount: 10,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'feed_demo_03',
        supplierId: 'sup_demo_01',
        name: 'Google Merchant Center Feed',
        sourceType: FeedSourceType.URL,
        fileFormat: FeedFormat.CSV,
        sourceUrl: 'https://supplier.com/feeds/google.csv',
        syncIntervalHours: 24,
        autoUpdatePrices: true,
        autoUpdateStocks: true,
        autoCreateNewProducts: true,
        productsCount: 5,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

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

    // Save or update feed source record
    const supplierSources = this.feedSources.get(options.supplierId) || [];
    const existingIndex = supplierSources.findIndex((s) => s.id === feedSourceId);

    const sourceRecord: FeedSourceDto = {
      id: feedSourceId,
      supplierId: options.supplierId,
      name:
        options.fileName || options.sourceUrl || `Фід ${new Date().toLocaleDateString('uk-UA')}`,
      sourceType:
        options.sourceType || (options.sourceUrl ? FeedSourceType.URL : FeedSourceType.FILE),
      fileFormat: FeedFormat.XML_ROZETKA,
      sourceUrl: options.sourceUrl,
      syncIntervalHours: 24,
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      autoCreateNewProducts: true,
      productsCount: result.createdCount,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'SUCCESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      supplierSources[existingIndex] = sourceRecord;
    } else {
      supplierSources.unshift(sourceRecord);
    }
    this.feedSources.set(options.supplierId, supplierSources);

    // Update supplier active feeds count in mock driver
    const supplier = mockDatabaseDriver.getSupplierById(options.supplierId);
    if (supplier) {
      supplier.activeFeedsCount = supplierSources.length;
    }

    return {
      totalProcessed: result.totalProcessed,
      createdCount: result.createdCount,
      feedSourceId,
    };
  }

  async getSupplierFeedSources(supplierId: string): Promise<FeedSourceDto[]> {
    return this.feedSources.get(supplierId) || [];
  }

  async getAllFeedSources(): Promise<FeedSourceDto[]> {
    const all: FeedSourceDto[] = [];
    for (const sources of this.feedSources.values()) {
      all.push(...sources);
    }
    return all;
  }

  async deleteSupplierFeedSource(supplierId: string, sourceId: string): Promise<boolean> {
    const sources = this.feedSources.get(supplierId) || [];
    const filtered = sources.filter((s) => s.id !== sourceId);
    this.feedSources.set(supplierId, filtered);

    const supplier = mockDatabaseDriver.getSupplierById(supplierId);
    if (supplier) {
      supplier.activeFeedsCount = filtered.length;
    }
    return true;
  }
}

export const localFeedsService = new LocalFeedsService();

if (typeof window !== 'undefined') {
  (window as unknown as { __LOCAL_FEEDS_SERVICE__?: LocalFeedsService }).__LOCAL_FEEDS_SERVICE__ =
    localFeedsService;
}
