// @golden - SQLite Dev Server: Feeds
import { db } from '../db.mjs';

function mapFeedRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    sourceType: r.source_type,
    fileFormat: r.file_format,
    sourceUrl: r.source_url || undefined,
    canonicalUrl: r.canonical_url || undefined,
    urlFingerprint: r.url_fingerprint || undefined,
    contentHash: r.content_hash || undefined,
    parentFeedSourceId: r.parent_feed_source_id || undefined,
    syncIntervalHours: r.sync_interval_hours || 0,
    autoUpdatePrices: Boolean(r.auto_update_prices),
    autoUpdateStocks: Boolean(r.auto_update_stocks),
    autoCreateNewProducts: Boolean(r.auto_create_new_products),
    baseCurrency: r.base_currency || 'UAH',
    targetCurrency: r.target_currency || 'UAH',
    exchangeRateMode: r.exchange_rate_mode || 'MANUAL',
    exchangeRate: r.exchange_rate ?? 1.0,
    currencyBufferPercent: r.currency_buffer_percent ?? 0,
    priceRounding: r.price_rounding || 'NONE',
    customRoundingRules: JSON.parse(r.custom_rounding_rules || '[]'),
    selectedBankId: r.selected_bank_id || null,
    lastSyncedAt: r.last_synced_at || null,
    lastSyncStatus: r.last_sync_status || null,
    productsCount: r.products_count || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function handleFeeds(command, args) {
  switch (command) {
    case 'db_get_supplier_feed_sources': {
      const rows = db.prepare(`
        SELECT f.*, COUNT(p.id) as products_count
        FROM local_feed_sources f
        LEFT JOIN local_products p ON p.feed_source_id = f.id
        WHERE f.supplier_id = ?
        GROUP BY f.id
        ORDER BY f.created_at DESC
      `).all(args.supplierId);
      return rows.map(mapFeedRow);
    }
    case 'db_get_all_feed_sources': {
      const rows = db.prepare(`
        SELECT f.*, COUNT(p.id) as products_count
        FROM local_feed_sources f
        LEFT JOIN local_products p ON p.feed_source_id = f.id
        GROUP BY f.id
        ORDER BY f.created_at DESC
      `).all();
      return rows.map(mapFeedRow);
    }
    case 'db_create_feed_source': {
      const { supplierId, payload: p } = args;
      const id = p.id || `feed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const name = p.name || 'Каталог товарів';
      const sourceType = p.sourceType || 'URL';
      const fileFormat = (p.format || p.fileFormat) ?? 'XML_ROZETKA';
      const sourceUrl = p.url || p.sourceUrl || null;
      const canonicalUrl = p.canonicalUrl || sourceUrl;
      const urlFingerprint = p.urlFingerprint || (sourceUrl ? Buffer.from(sourceUrl).toString('base64').substring(0, 32) : null);

      db.prepare(`
        INSERT INTO local_feed_sources (
          id, supplier_id, name, source_type, file_format, source_url, canonical_url, url_fingerprint,
          content_hash, parent_feed_source_id, sync_interval_hours, auto_update_prices, auto_update_stocks,
          auto_create_new_products, base_currency, target_currency, exchange_rate_mode, exchange_rate,
          currency_buffer_percent, price_rounding, custom_rounding_rules, selected_bank_id,
          last_synced_at, last_sync_status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          CURRENT_TIMESTAMP, 'SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        id, supplierId, name, sourceType, fileFormat, sourceUrl, canonicalUrl, urlFingerprint,
        p.contentHash || null, p.parentFeedSourceId || null, p.syncIntervalHours || 0,
        p.autoUpdatePrices === false ? 0 : 1, p.autoUpdateStocks === false ? 0 : 1,
        p.autoCreateNewProducts === false ? 0 : 1, p.baseCurrency || 'UAH', p.targetCurrency || 'UAH',
        p.exchangeRateMode || 'MANUAL', p.exchangeRate || 1.0, p.currencyBufferPercent || 0,
        p.priceRounding || 'NONE', JSON.stringify(p.customRoundingRules || []), p.selectedBankId || null,
      );
      return { totalProcessed: 1, createdCount: 1, feedSourceId: id };
    }
    case 'db_update_feed_source': {
      const { id, dto: p } = args;
      const updates = [];
      const values = [];
      const fields = [
        ['name', p.name], ['source_type', p.sourceType], ['file_format', p.fileFormat],
        ['source_url', p.sourceUrl], ['canonical_url', p.canonicalUrl], ['base_currency', p.baseCurrency],
        ['target_currency', p.targetCurrency], ['exchange_rate_mode', p.exchangeRateMode],
        ['price_rounding', p.priceRounding], ['selected_bank_id', p.selectedBankId],
      ];
      for (const [col, val] of fields) {
        if (val !== undefined) { updates.push(`${col} = ?`); values.push(val); }
      }
      if (p.autoUpdatePrices !== undefined) { updates.push('auto_update_prices = ?'); values.push(p.autoUpdatePrices ? 1 : 0); }
      if (p.autoUpdateStocks !== undefined) { updates.push('auto_update_stocks = ?'); values.push(p.autoUpdateStocks ? 1 : 0); }
      if (p.autoCreateNewProducts !== undefined) { updates.push('auto_create_new_products = ?'); values.push(p.autoCreateNewProducts ? 1 : 0); }
      if (p.exchangeRate !== undefined) { updates.push('exchange_rate = ?'); values.push(p.exchangeRate); }
      if (p.currencyBufferPercent !== undefined) { updates.push('currency_buffer_percent = ?'); values.push(p.currencyBufferPercent); }
      if (p.customRoundingRules !== undefined) { updates.push('custom_rounding_rules = ?'); values.push(JSON.stringify(p.customRoundingRules)); }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      db.prepare(`UPDATE local_feed_sources SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const row = db.prepare('SELECT * FROM local_feed_sources WHERE id = ?').get(id);
      return mapFeedRow(row);
    }
    case 'db_delete_feed_source': {
      const { id, deleteProducts = true } = args;
      let deletedProductsCount = 0;
      if (deleteProducts) {
        const res = db.prepare('DELETE FROM local_products WHERE feed_source_id = ?').run(id);
        deletedProductsCount = res.changes;
      }
      db.prepare('DELETE FROM local_feed_sources WHERE id = ?').run(id);
      return { success: true, deletedProductsCount };
    }
    case 'db_check_feed_collision': {
      const { dto } = args;
      const url = (dto.url || '').trim();
      const row = db.prepare('SELECT f.*, s.name as supplier_name FROM local_feed_sources f JOIN local_suppliers s ON s.id = f.supplier_id WHERE f.source_url = ? OR f.canonical_url = ?').get(url, url);
      if (row) {
        return {
          hasCollision: true,
          collisionType: 'EXACT_URL',
          existingFeedId: row.id,
          existingSupplierId: row.supplier_id,
          existingSupplierName: row.supplier_name,
          feedName: row.name,
          message: `Цей фід уже зареєстровано у постачальника "${row.supplier_name}"`,
        };
      }
      return { hasCollision: false };
    }
    default:
      return undefined;
  }
}
