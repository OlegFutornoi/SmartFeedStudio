import type {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
  ExportChannelPricingRuleDto,
  CreateExportChannelPricingRuleDto,
  PriceSimulationRequestDto,
  PriceSimulationResultDto,
  ProductDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
  FeedSourceDto,
  LocalProductImageDto,
  UpdateProductImageOrderDto,
  DeleteProductImageResultDto,
  SupplierCategoryRuleDto,
  UpdateSupplierCategoryRuleDto,
  MarketplaceCategoryDto,
  CreateMarketplaceCategoryDto,
  UpdateMarketplaceCategoryDto,
  LocalSupplierCategoryMarketplaceMapDto,
  CheckFeedCollisionDto,
  FeedCollisionResultDto,
} from '@smartfeed/shared';
import type { LocalCountersSummary } from '@/services/local-db/types';
import * as mock from '@/services/local-db/mock';

export class MockDatabaseDriver {
  private state: mock.MockDbState = mock.createInitialState();
  private currentUserId: string | null = null;

  constructor() {
    this.checkAndSeedIfEnabled();
  }

  public saveToStorage(): void {
    mock.saveMockDbToStorage(this.state, this.currentUserId);
  }

  public checkAndSeedIfEnabled(userId?: string | null): void {
    if (typeof window !== 'undefined') {
      mock.clearLegacyMockDbStorage();
      if (userId !== undefined) {
        this.currentUserId = userId;
      }
      const storageKey = mock.getStorageKey(this.currentUserId);
      const saved = window.localStorage?.getItem(storageKey);
      if (saved) {
        mock.restoreMockDbFromStorage(this.state, saved);
        return;
      }
      this.state = mock.createInitialState();
      if (window.localStorage?.getItem('smartfeed_e2e_seed') === 'true') {
        this.seedDefaultData();
      }
    }
  }

  public switchUser(userId: string | null): void {
    this.currentUserId = userId;
    this.state = mock.createInitialState();
    this.checkAndSeedIfEnabled(userId);
    this.saveToStorage();
  }

  public reset(): void {
    this.state = mock.createInitialState();
    this.saveToStorage();
  }

  public seedDefaultData(): void {
    mock.seedDefaultMockData(this.state);
  }

  // Suppliers & Pricing Rules
  public getSuppliers = (search?: string): SupplierDto[] => mock.getSuppliers(this.state, search);
  public getSupplierById = (id: string): SupplierDto | null => mock.getSupplierById(this.state, id);
  public createSupplier = (p: CreateSupplierDto): SupplierDto => mock.createSupplier(this.state, p);
  public updateSupplier = (id: string, p: UpdateSupplierDto): SupplierDto =>
    mock.updateSupplier(this.state, id, p);
  public deleteSupplier = (id: string): boolean => mock.deleteSupplier(this.state, id);

  // Supplier Categories & Marketplace Reference Directory
  public getSupplierCategories = (supplierId: string, search?: string): SupplierCategoryRuleDto[] =>
    mock.getSupplierCategories(this.state, supplierId, search);
  public toggleSupplierCategory = (
    sId: string,
    cId: string,
    active: boolean,
  ): SupplierCategoryRuleDto => mock.toggleSupplierCategory(this.state, sId, cId, active);
  public batchToggleSupplierCategories = (sId: string, cIds: string[], active: boolean) =>
    mock.batchToggleSupplierCategories(this.state, sId, cIds, active);
  public updateSupplierCategoryRule = (
    sId: string,
    cId: string,
    marginOrPayload?: number | null | UpdateSupplierCategoryRuleDto,
    markup?: number | null,
  ): SupplierCategoryRuleDto =>
    mock.updateSupplierCategoryRule(this.state, sId, cId, marginOrPayload, markup);
  public getMarketplaceCategories = (
    marketplaceCode?: string,
    search?: string,
  ): MarketplaceCategoryDto[] => mock.getMarketplaceCategories(this.state, marketplaceCode, search);
  public createMarketplaceCategory = (p: CreateMarketplaceCategoryDto): MarketplaceCategoryDto =>
    mock.createMarketplaceCategory(this.state, p);
  public updateMarketplaceCategory = (
    id: string,
    p: UpdateMarketplaceCategoryDto,
  ): MarketplaceCategoryDto => mock.updateMarketplaceCategory(this.state, id, p);
  public importMarketplaceCategories = (
    items: CreateMarketplaceCategoryDto[],
  ): { importedCount: number } => mock.importMarketplaceCategories(this.state, items);
  public autoMapSupplierCategories = (sId: string, marketplaceCode?: string) =>
    mock.autoMapSupplierCategories(this.state, sId, marketplaceCode);
  public getSupplierCategoryMarketplaceMaps = (
    sId?: string,
  ): LocalSupplierCategoryMarketplaceMapDto[] =>
    mock.getSupplierCategoryMarketplaceMaps(this.state, sId);
  public upsertSupplierCategoryMarketplaceMap = (
    p: Parameters<typeof mock.upsertSupplierCategoryMarketplaceMap>[1],
  ): LocalSupplierCategoryMarketplaceMapDto =>
    mock.upsertSupplierCategoryMarketplaceMap(this.state, p);
  public deleteSupplierCategoryMarketplaceMap = (sId: string, marketplaceCode: string): void =>
    mock.deleteSupplierCategoryMarketplaceMap(this.state, sId, marketplaceCode);

  // Pricing Rules
  public getPricingRules = (sId: string): SupplierPricingRuleDto[] =>
    mock.getPricingRules(this.state, sId);
  public createPricingRule = (sId: string, p: CreateSupplierPricingRuleDto) =>
    mock.createPricingRule(this.state, sId, p);
  public updatePricingRule = (sId: string, rId: string, p: UpdateSupplierPricingRuleDto) =>
    mock.updatePricingRule(this.state, sId, rId, p);
  public deletePricingRule = (sId: string, rId: string): boolean =>
    mock.deletePricingRule(this.state, sId, rId);

  // Supplier Sync (Prom / Rozetka Pattern)
  public getSupplierSyncSettings = (sId: string) => mock.getSupplierSyncSettings(this.state, sId);
  public updateSupplierSyncSettings = (
    sId: string,
    p: Parameters<typeof mock.updateSupplierSyncSettings>[2],
  ) => mock.updateSupplierSyncSettings(this.state, sId, p);
  public getSupplierSyncLogs = (sId: string) => mock.getSupplierSyncLogs(this.state, sId);
  public addSupplierSyncLog = (p: Parameters<typeof mock.addSupplierSyncLog>[1]) =>
    mock.addSupplierSyncLog(this.state, p);

  // Export Channels
  public getExportChannels = (): ExportChannelDto[] => mock.getExportChannels(this.state);
  public getExportChannelById = (id: string): ExportChannelDto | null =>
    mock.getExportChannelById(this.state, id);
  public createExportChannel = (p: CreateExportChannelDto): ExportChannelDto =>
    mock.createExportChannel(this.state, p);
  public updateExportChannel = (id: string, p: UpdateExportChannelDto): ExportChannelDto =>
    mock.updateExportChannel(this.state, id, p);
  public deleteExportChannel = (id: string): boolean => mock.deleteExportChannel(this.state, id);
  public getExportPricingRules = (cId: string): ExportChannelPricingRuleDto[] =>
    mock.getExportPricingRules(this.state, cId);
  public createExportPricingRule = (cId: string, p: CreateExportChannelPricingRuleDto) =>
    mock.createExportPricingRule(this.state, cId, p);
  public deleteExportPricingRule = (cId: string, rId: string): boolean =>
    mock.deleteExportPricingRule(this.state, cId, rId);
  public simulatePrice = (p: PriceSimulationRequestDto): PriceSimulationResultDto =>
    mock.simulatePrice(p);

  // Products & Categories
  public getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  }): { items: ProductDto[]; total: number; page: number; limit: number; totalPages: number } {
    return mock.getProducts(this.state, params);
  }
  public getCategoriesSummary = (supplierId?: string): ProductCategorySummaryDto[] =>
    mock.getCategoriesSummary(this.state, supplierId);
  public bulkDeleteProducts = (p: BulkDeleteProductsDto): BulkDeleteResultDto =>
    mock.bulkDeleteProducts(this.state, p);
  public bulkUpsertProducts = (products: ProductDto[]): { count: number } =>
    mock.bulkUpsertProducts(this.state, products);

  // Feed Sources
  public getSupplierFeedSources = (supplierId: string): FeedSourceDto[] =>
    mock.getSupplierFeedSources(this.state, supplierId);
  public getAllFeedSources = (): FeedSourceDto[] => mock.getAllFeedSources(this.state);
  public checkFeedCollision = (dto: CheckFeedCollisionDto): FeedCollisionResultDto =>
    mock.checkFeedCollision(this.state, dto);
  public createFeedSource = (sId: string, p: mock.CreateFeedSourcePayload) =>
    mock.createFeedSource(this.state, sId, p);
  public deleteFeedSource = (sId: string, srcId: string, del = true) =>
    mock.deleteFeedSource(this.state, sId, srcId, del);

  // Images Management
  public getProductImages = (productId: string): LocalProductImageDto[] =>
    mock.getProductImages(this.state, productId);
  public deleteProductImage = (imageId: string): DeleteProductImageResultDto =>
    mock.deleteProductImage(this.state, imageId);
  public updateImagesOrder = (p: UpdateProductImageOrderDto): void =>
    mock.updateImagesOrder(this.state, p);
  public downloadProductImage = (imgId: string, url: string): LocalProductImageDto =>
    mock.downloadProductImage(this.state, imgId, url);

  // Counters
  public syncCounters(): void {
    mock.syncCounters(this.state);
  }
  public getCounters() {
    this.syncCounters();
    return this.state.counters;
  }
  public getCountersSummary = (): LocalCountersSummary => {
    this.syncCounters();
    const feedsBySupplierId: Record<string, number> = {};
    const productsBySupplierId: Record<string, number> = {};
    const categoriesBySupplierId: Record<string, number> = {};
    const activeCategoriesBySupplierId: Record<string, number> = {};

    for (const s of this.state.suppliers) {
      feedsBySupplierId[s.id] = 0;
      productsBySupplierId[s.id] = 0;
      categoriesBySupplierId[s.id] = 0;
      activeCategoriesBySupplierId[s.id] = 0;
    }

    for (const [supId, sources] of this.state.feedSources.entries()) {
      feedsBySupplierId[supId] = sources.length;
    }
    for (const p of this.state.products) {
      if (p.supplierId) {
        productsBySupplierId[p.supplierId] = (productsBySupplierId[p.supplierId] || 0) + 1;
      }
    }

    let totalCategories = 0;
    for (const s of this.state.suppliers) {
      const feedsCount = feedsBySupplierId[s.id] || 0;
      const prodsCount = productsBySupplierId[s.id] || 0;
      if (feedsCount === 0 || prodsCount === 0) {
        categoriesBySupplierId[s.id] = 0;
        activeCategoriesBySupplierId[s.id] = 0;
      } else {
        const cats = mock.ensureSupplierCategories(this.state, s.id);
        categoriesBySupplierId[s.id] = cats.length;
        activeCategoriesBySupplierId[s.id] = cats.filter((c) => c.isActive).length;
        totalCategories += cats.length;
      }
    }

    let totalRules = 0;
    for (const [supId, rules] of this.state.pricingRules.entries()) {
      if (this.state.suppliers.some((s) => s.id === supId)) {
        totalRules += rules.length;
      }
    }

    return {
      totalSuppliers: this.state.suppliers.length,
      totalFeeds: this.state.counters.feedsCount,
      totalProducts: this.state.counters.productsCount,
      totalRules,
      totalCategories,
      feedsBySupplierId,
      productsBySupplierId,
      categoriesBySupplierId,
      activeCategoriesBySupplierId,
    };
  };
}

export const mockDatabaseDriver = new MockDatabaseDriver();

if (typeof window !== 'undefined') {
  (window as unknown as { __MOCK_LOCAL_DB__?: MockDatabaseDriver }).__MOCK_LOCAL_DB__ =
    mockDatabaseDriver;
}

mock.attachStorageHooks(mockDatabaseDriver, mock.MUTATING_METHODS);
