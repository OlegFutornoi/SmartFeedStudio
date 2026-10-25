import { mockDatabaseDriver } from '@/services/local-db/mock-driver';
import type { LocalDbCommandMap } from '@/services/local-db/types';

export function executeMockCommand<K extends keyof LocalDbCommandMap>(
  command: K,
  args: LocalDbCommandMap[K]['args'],
): LocalDbCommandMap[K]['result'] {
  switch (command) {
    // Counters
    case 'db_get_counters': {
      return mockDatabaseDriver.getCounters() as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_counters_summary': {
      return mockDatabaseDriver.getCountersSummary() as LocalDbCommandMap[K]['result'];
    }

    // Feed Sources
    case 'db_get_supplier_feed_sources': {
      const a = args as LocalDbCommandMap['db_get_supplier_feed_sources']['args'];
      return mockDatabaseDriver.getSupplierFeedSources(
        a.supplierId,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_all_feed_sources': {
      return mockDatabaseDriver.getAllFeedSources() as LocalDbCommandMap[K]['result'];
    }
    case 'db_check_feed_collision': {
      const a = args as LocalDbCommandMap['db_check_feed_collision']['args'];
      return mockDatabaseDriver.checkFeedCollision(a.dto) as LocalDbCommandMap[K]['result'];
    }
    case 'db_create_feed_source': {
      const a = args as LocalDbCommandMap['db_create_feed_source']['args'];
      return mockDatabaseDriver.createFeedSource(
        a.supplierId,
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_feed_source': {
      const a = args as LocalDbCommandMap['db_delete_feed_source']['args'];
      return mockDatabaseDriver.deleteFeedSource(
        a.supplierId,
        a.id,
        a.deleteProducts,
      ) as LocalDbCommandMap[K]['result'];
    }

    // Suppliers
    case 'db_get_suppliers': {
      const a = args as LocalDbCommandMap['db_get_suppliers']['args'];
      return mockDatabaseDriver.getSuppliers(a?.search) as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_supplier_by_id': {
      const a = args as LocalDbCommandMap['db_get_supplier_by_id']['args'];
      return mockDatabaseDriver.getSupplierById(a.id) as LocalDbCommandMap[K]['result'];
    }
    case 'db_create_supplier': {
      const a = args as LocalDbCommandMap['db_create_supplier']['args'];
      return mockDatabaseDriver.createSupplier(a.payload) as LocalDbCommandMap[K]['result'];
    }
    case 'db_update_supplier': {
      const a = args as LocalDbCommandMap['db_update_supplier']['args'];
      return mockDatabaseDriver.updateSupplier(a.id, a.payload) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_supplier': {
      const a = args as LocalDbCommandMap['db_delete_supplier']['args'];
      return mockDatabaseDriver.deleteSupplier(a.id) as LocalDbCommandMap[K]['result'];
    }

    // Supplier Categories
    case 'db_get_supplier_categories': {
      const a = args as LocalDbCommandMap['db_get_supplier_categories']['args'];
      return mockDatabaseDriver.getSupplierCategories(
        a.supplierId,
        a.search,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_toggle_supplier_category': {
      const a = args as LocalDbCommandMap['db_toggle_supplier_category']['args'];
      return mockDatabaseDriver.toggleSupplierCategory(
        a.supplierId,
        a.categoryId,
        a.isActive,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_batch_toggle_supplier_categories': {
      const a = args as LocalDbCommandMap['db_batch_toggle_supplier_categories']['args'];
      return mockDatabaseDriver.batchToggleSupplierCategories(
        a.supplierId,
        a.categoryIds,
        a.isActive,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_update_supplier_category_rule': {
      const a = args as LocalDbCommandMap['db_update_supplier_category_rule']['args'];
      return mockDatabaseDriver.updateSupplierCategoryRule(
        a.supplierId,
        a.categoryId,
        a.payload ?? a.marginPercent,
        a.fixedMarkup,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_marketplace_categories': {
      const a = args as LocalDbCommandMap['db_get_marketplace_categories']['args'];
      return mockDatabaseDriver.getMarketplaceCategories(
        a?.marketplaceCode,
        a?.search,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_create_marketplace_category': {
      const a = args as LocalDbCommandMap['db_create_marketplace_category']['args'];
      return mockDatabaseDriver.createMarketplaceCategory(
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_update_marketplace_category': {
      const a = args as LocalDbCommandMap['db_update_marketplace_category']['args'];
      return mockDatabaseDriver.updateMarketplaceCategory(
        a.id,
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_import_marketplace_categories': {
      const a = args as LocalDbCommandMap['db_import_marketplace_categories']['args'];
      return mockDatabaseDriver.importMarketplaceCategories(
        a.items,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_auto_map_supplier_categories': {
      const a = args as LocalDbCommandMap['db_auto_map_supplier_categories']['args'];
      return mockDatabaseDriver.autoMapSupplierCategories(
        a.supplierId,
        a.marketplaceCode,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_supplier_category_marketplace_maps': {
      const a = args as LocalDbCommandMap['db_get_supplier_category_marketplace_maps']['args'];
      return mockDatabaseDriver.getSupplierCategoryMarketplaceMaps(
        a?.supplierCategoryRuleId,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_upsert_supplier_category_marketplace_map': {
      const a = args as LocalDbCommandMap['db_upsert_supplier_category_marketplace_map']['args'];
      return mockDatabaseDriver.upsertSupplierCategoryMarketplaceMap(
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_supplier_category_marketplace_map': {
      const a = args as LocalDbCommandMap['db_delete_supplier_category_marketplace_map']['args'];
      return mockDatabaseDriver.deleteSupplierCategoryMarketplaceMap(
        a.supplierCategoryRuleId,
        a.marketplaceCode,
      ) as LocalDbCommandMap[K]['result'];
    }

    // Pricing Rules
    case 'db_get_pricing_rules': {
      const a = args as LocalDbCommandMap['db_get_pricing_rules']['args'];
      return mockDatabaseDriver.getPricingRules(a.supplierId) as LocalDbCommandMap[K]['result'];
    }
    case 'db_create_pricing_rule': {
      const a = args as LocalDbCommandMap['db_create_pricing_rule']['args'];
      return mockDatabaseDriver.createPricingRule(
        a.supplierId,
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_update_pricing_rule': {
      const a = args as LocalDbCommandMap['db_update_pricing_rule']['args'];
      return mockDatabaseDriver.updatePricingRule(
        a.supplierId,
        a.ruleId,
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_pricing_rule': {
      const a = args as LocalDbCommandMap['db_delete_pricing_rule']['args'];
      return mockDatabaseDriver.deletePricingRule(
        a.supplierId,
        a.ruleId,
      ) as LocalDbCommandMap[K]['result'];
    }

    // Export Channels
    case 'db_get_export_channels': {
      return mockDatabaseDriver.getExportChannels() as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_export_channel_by_id': {
      const a = args as LocalDbCommandMap['db_get_export_channel_by_id']['args'];
      return mockDatabaseDriver.getExportChannelById(a.id) as LocalDbCommandMap[K]['result'];
    }
    case 'db_create_export_channel': {
      const a = args as LocalDbCommandMap['db_create_export_channel']['args'];
      return mockDatabaseDriver.createExportChannel(a.payload) as LocalDbCommandMap[K]['result'];
    }
    case 'db_update_export_channel': {
      const a = args as LocalDbCommandMap['db_update_export_channel']['args'];
      return mockDatabaseDriver.updateExportChannel(
        a.id,
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_export_channel': {
      const a = args as LocalDbCommandMap['db_delete_export_channel']['args'];
      return mockDatabaseDriver.deleteExportChannel(a.id) as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_export_pricing_rules': {
      const a = args as LocalDbCommandMap['db_get_export_pricing_rules']['args'];
      return mockDatabaseDriver.getExportPricingRules(
        a.channelId,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_create_export_pricing_rule': {
      const a = args as LocalDbCommandMap['db_create_export_pricing_rule']['args'];
      return mockDatabaseDriver.createExportPricingRule(
        a.channelId,
        a.payload,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_export_pricing_rule': {
      const a = args as LocalDbCommandMap['db_delete_export_pricing_rule']['args'];
      return mockDatabaseDriver.deleteExportPricingRule(
        a.channelId,
        a.ruleId,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_simulate_price': {
      const a = args as LocalDbCommandMap['db_simulate_price']['args'];
      return mockDatabaseDriver.simulatePrice(a.payload) as LocalDbCommandMap[K]['result'];
    }

    // Products
    case 'db_get_products': {
      const a = args as LocalDbCommandMap['db_get_products']['args'];
      return mockDatabaseDriver.getProducts(a) as LocalDbCommandMap[K]['result'];
    }
    case 'db_get_categories_summary': {
      const a = args as LocalDbCommandMap['db_get_categories_summary']['args'];
      return mockDatabaseDriver.getCategoriesSummary(
        a?.supplierId,
      ) as LocalDbCommandMap[K]['result'];
    }
    case 'db_bulk_delete_products': {
      const a = args as LocalDbCommandMap['db_bulk_delete_products']['args'];
      return mockDatabaseDriver.bulkDeleteProducts(a.payload) as LocalDbCommandMap[K]['result'];
    }
    case 'db_bulk_upsert_products': {
      const a = args as LocalDbCommandMap['db_bulk_upsert_products']['args'];
      return mockDatabaseDriver.bulkUpsertProducts(a.products) as LocalDbCommandMap[K]['result'];
    }

    // Images
    case 'db_get_product_images': {
      const a = args as LocalDbCommandMap['db_get_product_images']['args'];
      return mockDatabaseDriver.getProductImages(a.productId) as LocalDbCommandMap[K]['result'];
    }
    case 'db_delete_product_image': {
      const a = args as LocalDbCommandMap['db_delete_product_image']['args'];
      return mockDatabaseDriver.deleteProductImage(a.imageId) as LocalDbCommandMap[K]['result'];
    }
    case 'db_update_product_images_order': {
      const a = args as LocalDbCommandMap['db_update_product_images_order']['args'];
      return mockDatabaseDriver.updateImagesOrder(a.payload) as LocalDbCommandMap[K]['result'];
    }
    case 'db_download_product_image': {
      const a = args as LocalDbCommandMap['db_download_product_image']['args'];
      return mockDatabaseDriver.downloadProductImage(
        a.imageId,
        a.imageUrl,
      ) as LocalDbCommandMap[K]['result'];
    }

    // Bank Exchange Rates
    case 'db_get_bank_rates': {
      const a = args as LocalDbCommandMap['db_get_bank_rates']['args'];
      return mockDatabaseDriver.getBankRates(a?.currency) as LocalDbCommandMap[K]['result'];
    }
    case 'db_save_bank_rates': {
      const a = args as LocalDbCommandMap['db_save_bank_rates']['args'];
      return mockDatabaseDriver.saveBankRates(a.rates) as LocalDbCommandMap[K]['result'];
    }

    default:
      throw new Error(`Unknown LocalDB command: ${command}`);
  }
}
