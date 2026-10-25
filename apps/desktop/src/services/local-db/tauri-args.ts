export function prepareTauriArgs(command: string, args: unknown): Record<string, unknown> {
  const raw = (args || {}) as Record<string, unknown>;

  switch (command) {
    case 'db_get_supplier_by_id':
      return {
        id: raw.id,
      };

    case 'db_get_categories_summary':
      return {
        supplierId: raw.supplierId || undefined,
        supplier_id: raw.supplierId || undefined,
      };

    case 'db_create_supplier':
      return {
        dto: raw.payload || raw.dto || raw,
      };

    case 'db_update_supplier':
      return {
        id: raw.id,
        dto: raw.payload || raw.dto || raw,
      };

    case 'db_check_feed_collision': {
      const dto = (raw.dto || raw) as Record<string, unknown>;
      return {
        dto: {
          supplierId: dto.supplierId,
          sourceType: dto.sourceType,
          sourceUrl: dto.sourceUrl,
          canonicalUrl: dto.canonicalUrl,
          urlFingerprint: dto.urlFingerprint,
          fileName: dto.fileName,
          feedName: dto.feedName,
          contentHash: dto.contentHash,
        },
      };
    }

    case 'db_create_feed_source': {
      const p = (raw.payload || {}) as Record<string, unknown>;
      const dto = {
        id: p.id || undefined,
        supplierId: raw.supplierId || p.supplierId,
        name: p.name,
        sourceType: p.sourceType,
        fileFormat: p.format || p.fileFormat,
        sourceUrl: p.url || p.sourceUrl,
        canonicalUrl: p.canonicalUrl,
        urlFingerprint: p.urlFingerprint,
        contentHash: p.contentHash,
        parentFeedSourceId: p.parentFeedSourceId,
        authHeaderName: p.authHeaderName,
        authHeaderValue: p.authHeaderValue,
        syncIntervalHours: p.syncIntervalHours || 24,
        autoUpdatePrices: p.autoUpdatePrices ?? true,
        autoUpdateStocks: p.autoUpdateStocks ?? true,
        autoCreateNewProducts: p.autoCreateNewProducts ?? true,
        mappingRules: typeof p.mappingRules === 'string' ? p.mappingRules : undefined,
      };
      return { dto };
    }

    case 'db_delete_feed_source':
      return {
        id: raw.id,
        deleteProducts: raw.deleteProducts ?? true,
        delete_products: raw.deleteProducts ?? true,
      };

    case 'db_update_feed_source':
      return {
        id: raw.id,
        dto: raw.dto || raw.payload || raw,
      };

    case 'db_get_supplier_feed_sources':
    case 'db_get_pricing_rules':
      return {
        supplierId: raw.supplierId,
        supplier_id: raw.supplierId,
      };

    case 'db_create_pricing_rule':
      return {
        supplierId: raw.supplierId,
        supplier_id: raw.supplierId,
        dto: raw.payload || raw.dto || raw,
      };

    case 'db_update_pricing_rule':
      return {
        supplierId: raw.supplierId,
        supplier_id: raw.supplierId,
        ruleId: raw.ruleId,
        rule_id: raw.ruleId,
        dto: raw.payload || raw.dto || raw,
      };

    case 'db_delete_pricing_rule':
      return {
        supplierId: raw.supplierId,
        supplier_id: raw.supplierId,
        ruleId: raw.ruleId,
        rule_id: raw.ruleId,
      };

    case 'db_bulk_delete_products': {
      const p = raw.payload as { productIds?: string[] } | undefined;
      return {
        ids: p?.productIds || raw.ids || [],
      };
    }

    case 'db_get_bank_rates':
      return {
        currency: raw.currency || undefined,
      };

    case 'db_save_bank_rates':
      return {
        rates: raw.rates || [],
      };

    default:
      return raw;
  }
}

export const REGISTERED_TAURI_COMMANDS = new Set([
  'db_get_counters',
  'db_get_counters_summary',
  'db_get_suppliers',
  'db_get_supplier_by_id',
  'db_create_supplier',
  'db_update_supplier',
  'db_delete_supplier',
  'db_get_pricing_rules',
  'db_create_pricing_rule',
  'db_update_pricing_rule',
  'db_delete_pricing_rule',
  'db_get_supplier_feed_sources',
  'db_get_all_feed_sources',
  'db_check_feed_collision',
  'db_create_feed_source',
  'db_update_feed_source',
  'db_delete_feed_source',
  'db_get_products',
  'db_get_categories_summary',
  'db_bulk_upsert_products',
  'db_bulk_delete_products',
  'db_get_product_images',
  'db_delete_product_image',
  'db_update_product_images_order',
  'db_download_product_image',
  'db_get_bank_rates',
  'db_save_bank_rates',
]);
