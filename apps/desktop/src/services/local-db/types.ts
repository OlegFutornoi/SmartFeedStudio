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
  FeedFormat,
  FeedSourceType,
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
  LiveBankRateDto,
  SupplierSyncSettingDto,
  UpdateSupplierSyncSettingDto,
  SupplierSyncLogDto,
} from '@smartfeed/shared';

export interface LocalCountersSummary {
  totalSuppliers: number;
  totalFeeds: number;
  totalProducts: number;
  totalRules: number;
  totalCategories?: number;
  feedsBySupplierId: Record<string, number>;
  productsBySupplierId: Record<string, number>;
  categoriesBySupplierId?: Record<string, number>;
  activeCategoriesBySupplierId?: Record<string, number>;
}

export interface LocalDbCommandMap {
  // Counters
  db_get_counters: {
    args: Record<string, never>;
    result: { id: string; suppliersCount: number; feedsCount: number; productsCount: number };
  };
  db_get_counters_summary: {
    args: Record<string, never>;
    result: LocalCountersSummary;
  };

  // Feed Sources
  db_get_supplier_feed_sources: { args: { supplierId: string }; result: FeedSourceDto[] };
  db_get_all_feed_sources: { args: Record<string, never>; result: FeedSourceDto[] };
  db_check_feed_collision: {
    args: { dto: CheckFeedCollisionDto };
    result: FeedCollisionResultDto;
  };
  db_create_feed_source: {
    args: {
      supplierId: string;
      payload: {
        id?: string;
        name?: string;
        sourceType?: FeedSourceType;
        format?: FeedFormat;
        url?: string;
        canonicalUrl?: string;
        urlFingerprint?: string;
        contentHash?: string;
        parentFeedSourceId?: string;
        syncIntervalHours?: number;
        autoUpdatePrices?: boolean;
        autoUpdateStocks?: boolean;
        autoCreateNewProducts?: boolean;
        productsCount?: number;
      };
    };
    result: { totalProcessed: number; createdCount: number; feedSourceId: string };
  };
  db_delete_feed_source: {
    args: { id: string; supplierId: string; deleteProducts?: boolean };
    result: { success: boolean; deletedProductsCount: number };
  };
  db_update_feed_source: {
    args: { id: string; dto: Partial<FeedSourceDto> };
    result: FeedSourceDto;
  };

  // Suppliers
  db_get_suppliers: { args: { search?: string }; result: SupplierDto[] };
  db_get_supplier_by_id: { args: { id: string }; result: SupplierDto | null };
  db_create_supplier: { args: { payload: CreateSupplierDto }; result: SupplierDto };
  db_update_supplier: { args: { id: string; payload: UpdateSupplierDto }; result: SupplierDto };
  db_delete_supplier: { args: { id: string }; result: boolean };

  // Supplier Categories & Marketplace Reference Directory
  db_get_supplier_categories: {
    args: { supplierId: string; search?: string };
    result: SupplierCategoryRuleDto[];
  };
  db_toggle_supplier_category: {
    args: { supplierId: string; categoryId: string; isActive: boolean };
    result: SupplierCategoryRuleDto;
  };
  db_batch_toggle_supplier_categories: {
    args: { supplierId: string; categoryIds: string[]; isActive: boolean };
    result: { updatedCount: number };
  };
  db_update_supplier_category_rule: {
    args: {
      supplierId: string;
      categoryId: string;
      marginPercent?: number | null;
      fixedMarkup?: number | null;
      payload?: UpdateSupplierCategoryRuleDto;
    };
    result: SupplierCategoryRuleDto;
  };
  db_get_marketplace_categories: {
    args: { marketplaceCode?: string; search?: string };
    result: MarketplaceCategoryDto[];
  };
  db_create_marketplace_category: {
    args: { payload: CreateMarketplaceCategoryDto };
    result: MarketplaceCategoryDto;
  };
  db_update_marketplace_category: {
    args: { id: string; payload: UpdateMarketplaceCategoryDto };
    result: MarketplaceCategoryDto;
  };
  db_import_marketplace_categories: {
    args: { items: CreateMarketplaceCategoryDto[] };
    result: { importedCount: number };
  };
  db_auto_map_supplier_categories: {
    args: { supplierId: string; marketplaceCode?: string };
    result: { mappedCount: number; categories: SupplierCategoryRuleDto[] };
  };
  db_get_supplier_category_marketplace_maps: {
    args: { supplierCategoryRuleId?: string };
    result: LocalSupplierCategoryMarketplaceMapDto[];
  };
  db_upsert_supplier_category_marketplace_map: {
    args: {
      payload: Partial<LocalSupplierCategoryMarketplaceMapDto> & {
        supplierCategoryRuleId: string;
        marketplaceCode: string;
        externalCategoryId: string;
        externalCategoryName: string;
      };
    };
    result: LocalSupplierCategoryMarketplaceMapDto;
  };
  db_delete_supplier_category_marketplace_map: {
    args: { supplierCategoryRuleId: string; marketplaceCode: string };
    result: void;
  };

  // Pricing Rules
  db_get_pricing_rules: { args: { supplierId: string }; result: SupplierPricingRuleDto[] };
  db_create_pricing_rule: {
    args: { supplierId: string; payload: CreateSupplierPricingRuleDto };
    result: SupplierPricingRuleDto;
  };
  db_update_pricing_rule: {
    args: { supplierId: string; ruleId: string; payload: UpdateSupplierPricingRuleDto };
    result: SupplierPricingRuleDto;
  };
  db_delete_pricing_rule: {
    args: { supplierId: string; ruleId: string };
    result: boolean;
  };

  // Export Channels
  db_get_export_channels: { args: Record<string, never>; result: ExportChannelDto[] };
  db_get_export_channel_by_id: { args: { id: string }; result: ExportChannelDto | null };
  db_create_export_channel: {
    args: { payload: CreateExportChannelDto };
    result: ExportChannelDto;
  };
  db_update_export_channel: {
    args: { id: string; payload: UpdateExportChannelDto };
    result: ExportChannelDto;
  };
  db_delete_export_channel: { args: { id: string }; result: boolean };
  db_get_export_pricing_rules: {
    args: { channelId: string };
    result: ExportChannelPricingRuleDto[];
  };
  db_create_export_pricing_rule: {
    args: { channelId: string; payload: CreateExportChannelPricingRuleDto };
    result: ExportChannelPricingRuleDto;
  };
  db_delete_export_pricing_rule: {
    args: { channelId: string; ruleId: string };
    result: boolean;
  };
  db_simulate_price: {
    args: { payload: PriceSimulationRequestDto };
    result: PriceSimulationResultDto;
  };

  // Products
  db_get_products: {
    args: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      supplierId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
    };
    result: {
      items: ProductDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  db_get_categories_summary: {
    args: { supplierId?: string };
    result: ProductCategorySummaryDto[];
  };
  db_bulk_delete_products: {
    args: { payload: BulkDeleteProductsDto };
    result: BulkDeleteResultDto;
  };
  db_bulk_upsert_products: {
    args: { products: ProductDto[] };
    result: { count: number };
  };

  // Product Images
  db_get_product_images: {
    args: { productId: string };
    result: LocalProductImageDto[];
  };
  db_delete_product_image: {
    args: { imageId: string };
    result: DeleteProductImageResultDto;
  };
  db_update_product_images_order: {
    args: { payload: UpdateProductImageOrderDto };
    result: void;
  };
  db_download_product_image: {
    args: { imageId: string; imageUrl: string };
    result: LocalProductImageDto;
  };

  // Bank Exchange Rates
  db_get_bank_rates: {
    args: { currency?: string };
    result: LiveBankRateDto[];
  };
  db_save_bank_rates: {
    args: { rates: LiveBankRateDto[] };
    result: void;
  };

  // Supplier Sync & Logs
  db_get_supplier_sync_settings: {
    args: { supplierId: string };
    result: SupplierSyncSettingDto;
  };
  db_update_supplier_sync_settings: {
    args: { supplierId: string; payload: UpdateSupplierSyncSettingDto };
    result: SupplierSyncSettingDto;
  };
  db_get_supplier_sync_logs: {
    args: { supplierId: string; limit?: number };
    result: SupplierSyncLogDto[];
  };
  db_add_supplier_sync_log: {
    args: { log: SupplierSyncLogDto };
    result: SupplierSyncLogDto;
  };
  db_clear_supplier_sync_logs: {
    args: { supplierId: string };
    result: { success: boolean };
  };
}
