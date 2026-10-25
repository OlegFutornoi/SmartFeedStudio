// @golden - SQLite Dev Server: Categories
import { db } from '../db.mjs';

export function handleCategories(command, args) {
  switch (command) {
    case 'db_get_supplier_categories': {
      const { supplierId, search } = args;
      let query = 'SELECT * FROM local_supplier_categories WHERE supplier_id = ?';
      const params = [supplierId];
      if (search && search.trim()) {
        query += ' AND LOWER(name) LIKE ?';
        params.push(`%${search.trim().toLowerCase()}%`);
      }
      query += ' ORDER BY name ASC';
      const rows = db.prepare(query).all(...params);
      return rows.map((r) => ({
        id: r.id,
        supplierId: r.supplier_id,
        feedCategoryId: r.feed_category_id,
        name: r.name,
        parentId: r.parent_id || null,
        isActive: Boolean(r.is_active),
        marginPercent: r.margin_percent,
        fixedMarkup: r.fixed_markup,
        productCount: r.product_count || 0,
        feedSourceId: r.feed_source_id || null,
        feedName: r.feed_name || null,
        marketplaceMappings: JSON.parse(r.marketplace_mappings || '{}'),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
    case 'db_toggle_supplier_category': {
      const { categoryId, isActive } = args;
      db.prepare('UPDATE local_supplier_categories SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(isActive ? 1 : 0, categoryId);
      const row = db.prepare('SELECT * FROM local_supplier_categories WHERE id = ?').get(categoryId);
      return {
        id: row.id,
        supplierId: row.supplier_id,
        feedCategoryId: row.feed_category_id,
        name: row.name,
        parentId: row.parent_id || null,
        isActive: Boolean(row.is_active),
        marginPercent: row.margin_percent,
        fixedMarkup: row.fixed_markup,
        productCount: row.product_count || 0,
        feedSourceId: row.feed_source_id || null,
        feedName: row.feed_name || null,
        marketplaceMappings: JSON.parse(row.marketplace_mappings || '{}'),
      };
    }
    case 'db_batch_toggle_supplier_categories': {
      const { categoryIds, isActive } = args;
      const stmt = db.prepare('UPDATE local_supplier_categories SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      let updatedCount = 0;
      for (const id of categoryIds) {
        const res = stmt.run(isActive ? 1 : 0, id);
        updatedCount += res.changes;
      }
      return { updatedCount };
    }
    case 'db_update_supplier_category_rule': {
      const { supplierId, categoryId, marginPercent, fixedMarkup, payload: p } = args;
      const margin = p?.marginPercent ?? marginPercent ?? null;
      const markup = p?.fixedMarkup ?? fixedMarkup ?? null;
      db.prepare(`
        UPDATE local_supplier_categories
        SET margin_percent = ?, fixed_markup = ?, updated_at = CURRENT_TIMESTAMP
        WHERE supplier_id = ? AND (id = ? OR feed_category_id = ?)
      `).run(margin, markup, supplierId, categoryId, categoryId);
      const row = db.prepare('SELECT * FROM local_supplier_categories WHERE supplier_id = ? AND (id = ? OR feed_category_id = ?)').get(supplierId, categoryId, categoryId);
      return {
        id: row?.id || categoryId,
        supplierId,
        feedCategoryId: row?.feed_category_id || categoryId,
        name: row?.name || 'Категорія',
        parentId: row?.parent_id || null,
        isActive: Boolean(row?.is_active ?? 1),
        marginPercent: row?.margin_percent,
        fixedMarkup: row?.fixed_markup,
        productCount: row?.product_count || 0,
        feedSourceId: row?.feed_source_id || null,
        feedName: row?.feed_name || null,
        marketplaceMappings: JSON.parse(row?.marketplace_mappings || '{}'),
      };
    }
    default:
      return undefined;
  }
}
