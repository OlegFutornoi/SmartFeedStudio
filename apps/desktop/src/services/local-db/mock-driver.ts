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
} from '@smartfeed/shared';
import {
  type MockDbState,
  createInitialState,
  syncCounters,
  seedDefaultMockData,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  getExportChannels,
  getExportChannelById,
  createExportChannel,
  updateExportChannel,
  deleteExportChannel,
  getExportPricingRules,
  createExportPricingRule,
  deleteExportPricingRule,
  simulatePrice,
  getProducts,
  getCategoriesSummary,
  bulkDeleteProducts,
  bulkUpsertProducts,
  getSupplierFeedSources,
  getAllFeedSources,
  createFeedSource,
  deleteFeedSource,
  type CreateFeedSourcePayload,
  getProductImages,
  deleteProductImage,
  updateImagesOrder,
  downloadProductImage,
  saveMockDbToStorage,
  restoreMockDbFromStorage,
  attachStorageHooks,
  MUTATING_METHODS,
  getStorageKey,
  clearLegacyMockDbStorage,
} from '@/services/local-db/mock';

export class MockDatabaseDriver {
  private state: MockDbState = createInitialState();
  private currentUserId: string | null = null;

  constructor() {
    this.checkAndSeedIfEnabled();
  }

  public saveToStorage(): void {
    saveMockDbToStorage(this.state, this.currentUserId);
  }

  public checkAndSeedIfEnabled(userId?: string | null): void {
    if (typeof window !== 'undefined') {
      clearLegacyMockDbStorage();
      if (userId !== undefined) {
        this.currentUserId = userId;
      }
      const storageKey = getStorageKey(this.currentUserId);
      const saved = window.localStorage?.getItem(storageKey);
      if (saved) {
        restoreMockDbFromStorage(this.state, saved);
        return;
      }
      this.state = createInitialState();
      if (window.localStorage?.getItem('smartfeed_e2e_seed') === 'true') {
        this.seedDefaultData();
      }
    }
  }

  public switchUser(userId: string | null): void {
    this.currentUserId = userId;
    this.state = createInitialState();
    this.checkAndSeedIfEnabled(userId);
    this.saveToStorage();
  }

  public reset(): void {
    this.state = createInitialState();
    this.saveToStorage();
  }

  public seedDefaultData(): void {
    seedDefaultMockData(this.state);
  }

  // Suppliers & Pricing Rules
  public getSuppliers(search?: string): SupplierDto[] {
    return getSuppliers(this.state, search);
  }

  public getSupplierById(id: string): SupplierDto | null {
    return getSupplierById(this.state, id);
  }

  public createSupplier(payload: CreateSupplierDto): SupplierDto {
    return createSupplier(this.state, payload);
  }

  public updateSupplier(id: string, payload: UpdateSupplierDto): SupplierDto {
    return updateSupplier(this.state, id, payload);
  }

  public deleteSupplier(id: string): boolean {
    return deleteSupplier(this.state, id);
  }

  public getPricingRules(supplierId: string): SupplierPricingRuleDto[] {
    return getPricingRules(this.state, supplierId);
  }

  public createPricingRule(
    supplierId: string,
    payload: CreateSupplierPricingRuleDto,
  ): SupplierPricingRuleDto {
    return createPricingRule(this.state, supplierId, payload);
  }

  public updatePricingRule(
    supplierId: string,
    ruleId: string,
    payload: UpdateSupplierPricingRuleDto,
  ): SupplierPricingRuleDto {
    return updatePricingRule(this.state, supplierId, ruleId, payload);
  }

  public deletePricingRule(supplierId: string, ruleId: string): boolean {
    return deletePricingRule(this.state, supplierId, ruleId);
  }

  // Export Channels & Pricing Rules
  public getExportChannels(): ExportChannelDto[] {
    return getExportChannels(this.state);
  }

  public getExportChannelById(id: string): ExportChannelDto | null {
    return getExportChannelById(this.state, id);
  }

  public createExportChannel(payload: CreateExportChannelDto): ExportChannelDto {
    return createExportChannel(this.state, payload);
  }

  public updateExportChannel(id: string, payload: UpdateExportChannelDto): ExportChannelDto {
    return updateExportChannel(this.state, id, payload);
  }

  public deleteExportChannel(id: string): boolean {
    return deleteExportChannel(this.state, id);
  }

  public getExportPricingRules(channelId: string): ExportChannelPricingRuleDto[] {
    return getExportPricingRules(this.state, channelId);
  }

  public createExportPricingRule(
    channelId: string,
    payload: CreateExportChannelPricingRuleDto,
  ): ExportChannelPricingRuleDto {
    return createExportPricingRule(this.state, channelId, payload);
  }

  public deleteExportPricingRule(channelId: string, ruleId: string): boolean {
    return deleteExportPricingRule(this.state, channelId, ruleId);
  }

  public simulatePrice(payload: PriceSimulationRequestDto): PriceSimulationResultDto {
    return simulatePrice(payload);
  }

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
  }): {
    items: ProductDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    return getProducts(this.state, params);
  }

  public getCategoriesSummary(supplierId?: string): ProductCategorySummaryDto[] {
    return getCategoriesSummary(this.state, supplierId);
  }

  public bulkDeleteProducts(payload: BulkDeleteProductsDto): BulkDeleteResultDto {
    return bulkDeleteProducts(this.state, payload);
  }

  public bulkUpsertProducts(products: ProductDto[]): { count: number } {
    return bulkUpsertProducts(this.state, products);
  }

  // Feed Sources
  public getSupplierFeedSources(supplierId: string): FeedSourceDto[] {
    return getSupplierFeedSources(this.state, supplierId);
  }

  public getAllFeedSources(): FeedSourceDto[] {
    return getAllFeedSources(this.state);
  }

  public createFeedSource(
    supplierId: string,
    payload: CreateFeedSourcePayload,
  ): { totalProcessed: number; createdCount: number; feedSourceId: string } {
    return createFeedSource(this.state, supplierId, payload);
  }

  public deleteFeedSource(
    supplierId: string,
    sourceId: string,
    deleteProducts = true,
  ): { success: boolean; deletedProductsCount: number } {
    return deleteFeedSource(this.state, supplierId, sourceId, deleteProducts);
  }

  // Images Management
  public getProductImages(productId: string): LocalProductImageDto[] {
    return getProductImages(this.state, productId);
  }

  public deleteProductImage(imageId: string): DeleteProductImageResultDto {
    return deleteProductImage(this.state, imageId);
  }

  public updateImagesOrder(payload: UpdateProductImageOrderDto): void {
    updateImagesOrder(this.state, payload);
  }

  public downloadProductImage(imageId: string, imageUrl: string): LocalProductImageDto {
    return downloadProductImage(this.state, imageId, imageUrl);
  }

  // Counters
  public syncCounters(): void {
    syncCounters(this.state);
  }

  public getCounters() {
    this.syncCounters();
    return this.state.counters;
  }
}

export const mockDatabaseDriver = new MockDatabaseDriver();

if (typeof window !== 'undefined') {
  (window as unknown as { __MOCK_LOCAL_DB__?: MockDatabaseDriver }).__MOCK_LOCAL_DB__ =
    mockDatabaseDriver;
}

attachStorageHooks(mockDatabaseDriver, MUTATING_METHODS);
