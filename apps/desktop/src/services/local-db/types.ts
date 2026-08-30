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
} from '@smartfeed/shared';

export interface LocalDbCommandMap {
  // Suppliers
  db_get_suppliers: { args: { search?: string }; result: SupplierDto[] };
  db_get_supplier_by_id: { args: { id: string }; result: SupplierDto | null };
  db_create_supplier: { args: { payload: CreateSupplierDto }; result: SupplierDto };
  db_update_supplier: { args: { id: string; payload: UpdateSupplierDto }; result: SupplierDto };
  db_delete_supplier: { args: { id: string }; result: boolean };

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
}
