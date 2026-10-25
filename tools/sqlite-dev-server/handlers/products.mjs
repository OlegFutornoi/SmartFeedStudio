// @golden - SQLite Dev Server: Products
import { db } from '../db.mjs';

export function handleProducts(command, args) {
  switch (command) {
    case 'db_bulk_upsert_products': {
      const products = args.products || [];
      const prodStmt = db.prepare(`
        INSERT INTO local_products (
          id, catalog_id, supplier_id, feed_source_id, category_id, category_name_uk, sku, external_id,
          barcode, vendor_code, title_uk, title_en, description_uk, description_en, vendor, cost_price,
          price, old_price, currency, stock_quantity, in_stock, status, raw_payload, attributes_json, images_json,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT(id) DO UPDATE SET
          category_id = excluded.category_id,
          category_name_uk = excluded.category_name_uk,
          sku = excluded.sku,
          price = excluded.price,
          old_price = excluded.old_price,
          currency = excluded.currency,
          stock_quantity = excluded.stock_quantity,
          in_stock = excluded.in_stock,
          status = excluded.status,
          title_uk = excluded.title_uk,
          description_uk = excluded.description_uk,
          images_json = excluded.images_json,
          updated_at = CURRENT_TIMESTAMP
      `);

      const catStmt = db.prepare(`
        INSERT INTO local_supplier_categories (
          id, supplier_id, feed_category_id, name, parent_id, is_active,
          product_count, feed_source_id, feed_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          product_count = local_supplier_categories.product_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const p of products) {
        prodStmt.run(
          p.id, p.catalogId || 'default', p.supplierId, p.feedSourceId || null,
          p.categoryId || null, p.categoryNameUk || null, p.sku, p.externalId || null,
          p.barcode || null, p.vendorCode || null, p.titleUk || p.title || p.sku,
          p.titleEn || null, p.descriptionUk || p.description || null, p.descriptionEn || null,
          p.vendor || null, p.costPrice || 0, p.price || 0, p.oldPrice || null,
          p.currency || 'UAH', p.stockQuantity || 0, p.inStock ? 1 : 0, p.status || 'ACTIVE',
          JSON.stringify(p), JSON.stringify(p.attributes || []), JSON.stringify(p.images || []),
        );

        if (p.categoryId) {
          const catId = `cat_${p.supplierId}_${p.categoryId}`;
          catStmt.run(
            catId, p.supplierId, p.categoryId, p.categoryNameUk || p.categoryId,
            null, p.feedSourceId || null, null,
          );
        }
      }
      return { count: products.length };
    }
    case 'db_get_products': {
      const { page = 1, limit = 50, search, category, supplierId, inStockOnly } = args;
      const offset = (page - 1) * limit;
      let where = 'WHERE 1=1';
      const params = [];

      if (supplierId) {
        where += ' AND p.supplier_id = ?';
        params.push(supplierId);
      }
      if (inStockOnly) {
        where += ' AND p.in_stock = 1';
      }
      if (category) {
        where += ' AND (p.category_id = ? OR p.category_name_uk = ?)';
        params.push(category, category);
      }
      if (search && search.trim()) {
        where += ' AND (LOWER(p.title_uk) LIKE ? OR LOWER(p.sku) LIKE ?)';
        params.push(`%${search.trim().toLowerCase()}%`, `%${search.trim().toLowerCase()}%`);
      }

      const total = db.prepare(`SELECT COUNT(*) as cnt FROM local_products p ${where}`).get(...params).cnt;
      const rows = db.prepare(`
        SELECT p.* FROM local_products p
        ${where}
        ORDER BY p.updated_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      const items = rows.map((r) => ({
        id: r.id,
        catalogId: r.catalog_id,
        supplierId: r.supplier_id,
        feedSourceId: r.feed_source_id,
        categoryId: r.category_id,
        categoryNameUk: r.category_name_uk,
        sku: r.sku,
        externalId: r.external_id,
        barcode: r.barcode,
        vendorCode: r.vendor_code,
        titleUk: r.title_uk,
        titleEn: r.title_en,
        descriptionUk: r.description_uk,
        descriptionEn: r.description_en,
        vendor: r.vendor,
        costPrice: r.cost_price,
        price: r.price,
        oldPrice: r.old_price,
        currency: r.currency,
        stockQuantity: r.stock_quantity,
        inStock: Boolean(r.in_stock),
        status: r.status,
        attributes: JSON.parse(r.attributes_json || '[]'),
        images: JSON.parse(r.images_json || '[]'),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
    case 'db_get_categories_summary': {
      const { supplierId } = args;
      let query = `
        SELECT category_id, category_name_uk, COUNT(*) as count
        FROM local_products
        WHERE category_id IS NOT NULL
      `;
      const params = [];
      if (supplierId) {
        query += ' AND supplier_id = ?';
        params.push(supplierId);
      }
      query += ' GROUP BY category_id, category_name_uk ORDER BY count DESC';
      const rows = db.prepare(query).all(...params);
      return rows.map((r) => ({
        categoryId: r.category_id,
        name: r.category_name_uk || r.category_id,
        productCount: r.count,
      }));
    }
    case 'db_bulk_delete_products': {
      const { payload } = args;
      const ids = payload?.productIds || [];
      const stmt = db.prepare('DELETE FROM local_products WHERE id = ?');
      let deletedCount = 0;
      for (const id of ids) {
        const res = stmt.run(id);
        deletedCount += res.changes;
      }
      return { success: true, deletedCount };
    }
    default:
      return undefined;
  }
}
