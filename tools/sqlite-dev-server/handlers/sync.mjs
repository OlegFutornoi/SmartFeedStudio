// @golden - SQLite Dev Server: Supplier Sync & Logs
import { db } from '../db.mjs';

export function handleSync(command, args) {
  switch (command) {
    case 'db_get_supplier_sync_settings': {
      const row = db.prepare('SELECT * FROM local_supplier_sync_settings WHERE supplier_id = ?').get(args.supplierId);
      if (row) {
        return {
          id: row.id,
          supplierId: row.supplier_id,
          protectEditedProducts: Boolean(row.protect_edited_products),
          syncPrices: Boolean(row.sync_prices),
          syncStocks: Boolean(row.sync_stocks),
          imageSyncMode: row.image_sync_mode,
          descriptionSyncMode: row.description_sync_mode,
          attributesSyncMode: row.attributes_sync_mode,
          titleSyncMode: row.title_sync_mode,
          categorySyncMode: row.category_sync_mode,
          barcodeSyncMode: row.barcode_sync_mode,
          priceSource: row.price_source,
          zeroPriceAction: row.zero_price_action,
          missingProductsAction: row.missing_products_action,
          newProductsAction: row.new_products_action,
          syncIntervalHours: row.sync_interval_hours,
          lastSyncedAt: row.last_synced_at,
          lastSyncStatus: row.last_sync_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
      return {
        id: `sync_set_${args.supplierId}`,
        supplierId: args.supplierId,
        protectEditedProducts: true,
        syncPrices: true,
        syncStocks: true,
        imageSyncMode: 'DO_NOT_UPDATE',
        descriptionSyncMode: 'DO_NOT_UPDATE',
        attributesSyncMode: 'ADD_NEW_ONLY',
        titleSyncMode: 'DO_NOT_UPDATE',
        categorySyncMode: 'KEEP_MANUAL_MAPPING',
        barcodeSyncMode: 'FILL_EMPTY_ONLY',
        priceSource: 'WHOLESALE',
        zeroPriceAction: 'OUT_OF_STOCK',
        missingProductsAction: 'OUT_OF_STOCK',
        newProductsAction: 'AUTO_PUBLISH',
        syncIntervalHours: 0,
        lastSyncedAt: null,
        lastSyncStatus: 'IDLE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    case 'db_update_supplier_sync_settings': {
      const { supplierId, payload: p } = args;
      const id = `sync_set_${supplierId}`;
      db.prepare(`
        INSERT INTO local_supplier_sync_settings (
          id, supplier_id, protect_edited_products, sync_prices, sync_stocks,
          image_sync_mode, description_sync_mode, attributes_sync_mode, title_sync_mode,
          category_sync_mode, barcode_sync_mode, price_source, zero_price_action,
          missing_products_action, new_products_action, sync_interval_hours, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(supplier_id) DO UPDATE SET
          protect_edited_products = COALESCE(excluded.protect_edited_products, local_supplier_sync_settings.protect_edited_products),
          sync_prices = COALESCE(excluded.sync_prices, local_supplier_sync_settings.sync_prices),
          sync_stocks = COALESCE(excluded.sync_stocks, local_supplier_sync_settings.sync_stocks),
          image_sync_mode = COALESCE(excluded.image_sync_mode, local_supplier_sync_settings.image_sync_mode),
          description_sync_mode = COALESCE(excluded.description_sync_mode, local_supplier_sync_settings.description_sync_mode),
          attributes_sync_mode = COALESCE(excluded.attributes_sync_mode, local_supplier_sync_settings.attributes_sync_mode),
          title_sync_mode = COALESCE(excluded.title_sync_mode, local_supplier_sync_settings.title_sync_mode),
          category_sync_mode = COALESCE(excluded.category_sync_mode, local_supplier_sync_settings.category_sync_mode),
          barcode_sync_mode = COALESCE(excluded.barcode_sync_mode, local_supplier_sync_settings.barcode_sync_mode),
          price_source = COALESCE(excluded.price_source, local_supplier_sync_settings.price_source),
          zero_price_action = COALESCE(excluded.zero_price_action, local_supplier_sync_settings.zero_price_action),
          missing_products_action = COALESCE(excluded.missing_products_action, local_supplier_sync_settings.missing_products_action),
          new_products_action = COALESCE(excluded.new_products_action, local_supplier_sync_settings.new_products_action),
          sync_interval_hours = COALESCE(excluded.sync_interval_hours, local_supplier_sync_settings.sync_interval_hours),
          updated_at = CURRENT_TIMESTAMP
      `).run(
        id, supplierId,
        p.protectEditedProducts === undefined ? null : (p.protectEditedProducts ? 1 : 0),
        p.syncPrices === undefined ? null : (p.syncPrices ? 1 : 0),
        p.syncStocks === undefined ? null : (p.syncStocks ? 1 : 0),
        p.imageSyncMode ?? null, p.descriptionSyncMode ?? null, p.attributesSyncMode ?? null,
        p.titleSyncMode ?? null, p.categorySyncMode ?? null, p.barcodeSyncMode ?? null,
        p.priceSource ?? null, p.zeroPriceAction ?? null, p.missingProductsAction ?? null,
        p.newProductsAction ?? null, p.syncIntervalHours ?? null,
      );
      return handleSync('db_get_supplier_sync_settings', { supplierId });
    }
    case 'db_get_supplier_sync_logs': {
      const limit = args.limit || 50;
      const rows = db.prepare('SELECT * FROM local_supplier_sync_logs WHERE supplier_id = ? ORDER BY started_at DESC LIMIT ?').all(args.supplierId, limit);
      return rows.map((r) => ({
        id: r.id,
        supplierId: r.supplier_id,
        feedSourceId: r.feed_source_id,
        trigger: r.trigger,
        status: r.status,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        durationMs: r.duration_ms,
        totalProducts: r.total_products,
        createdCount: r.created_count,
        updatedCount: r.updated_count,
        outOfStockCount: r.out_of_stock_count,
        errorsCount: r.errors_count,
        errorMessage: r.error_message,
        createdAt: r.created_at,
      }));
    }
    case 'db_add_supplier_sync_log': {
      const l = args.log;
      db.prepare(`
        INSERT INTO local_supplier_sync_logs (
          id, supplier_id, feed_source_id, trigger, status, started_at, completed_at,
          duration_ms, total_products, created_count, updated_count, out_of_stock_count,
          errors_count, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        l.id, l.supplierId, l.feedSourceId || null, l.trigger || 'MANUAL', l.status || 'SUCCESS',
        l.startedAt || new Date().toISOString(), l.completedAt || new Date().toISOString(),
        l.durationMs || 0, l.totalProducts || 0, l.createdCount || 0, l.updatedCount || 0,
        l.outOfStockCount || 0, l.errorsCount || 0, l.errorMessage || null,
      );
      return l;
    }
    case 'db_clear_supplier_sync_logs': {
      db.prepare('DELETE FROM local_supplier_sync_logs WHERE supplier_id = ?').run(args.supplierId);
      return { success: true };
    }
    default:
      return undefined;
  }
}
