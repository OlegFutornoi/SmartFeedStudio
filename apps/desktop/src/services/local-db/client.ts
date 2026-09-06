import { isTauri } from '../../lib/runtime';
import { mockDatabaseDriver } from './mock-driver';
import type { LocalDbCommandMap } from './types';

/**
 * Universal Local Database Dispatcher:
 * - When running in Tauri native app -> routes to Rust SQLCipher commands.
 * - When running in Web / Playwright E2E -> routes to high-speed In-Memory driver.
 */
export async function invokeLocalDb<K extends keyof LocalDbCommandMap>(
  command: K,
  args: LocalDbCommandMap[K]['args'],
): Promise<LocalDbCommandMap[K]['result']> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return (await invoke(
        command,
        args as Record<string, unknown>,
      )) as LocalDbCommandMap[K]['result'];
    } catch (error) {
      console.warn(
        `[LocalDB IPC] Tauri invoke('${command}') failed, falling back to mock driver:`,
        error,
      );
    }
  }

  // Fallback / Browser Test Mode
  switch (command) {
    // Counters
    case 'db_get_counters': {
      return mockDatabaseDriver.getCounters() as LocalDbCommandMap[K]['result'];
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

    default:
      throw new Error(`Unknown LocalDB command: ${command}`);
  }
}
