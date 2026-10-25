// @golden - SQLite Dev Server: Marketplace Categories & Mappings
import { db } from '../db.mjs';

export function handleMarketplace(command, args) {
  switch (command) {
    case 'db_get_marketplace_categories': {
      const code = args?.marketplaceCode || 'ROZETKA';
      const search = (args?.search || '').trim().toLowerCase();
      let query = 'SELECT * FROM local_marketplace_categories WHERE marketplace_code = ?';
      const params = [code];
      if (search) {
        query += ' AND LOWER(name_uk) LIKE ?';
        params.push(`%${search}%`);
      }
      query += ' ORDER BY name_uk ASC';
      const rows = db.prepare(query).all(...params);
      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        marketplaceCode: r.marketplace_code,
        externalId: r.external_id,
        xmlAttributeName: r.xml_attribute_name,
        nameUk: r.name_uk,
        nameEn: r.name_en,
        fullPathUk: r.full_path_uk,
        parentExternalId: r.parent_external_id,
        url: r.url,
        defaultCommissionPercent: r.default_commission_percent,
        defaultFixedFee: r.default_fixed_fee,
        isLeaf: Boolean(r.is_leaf),
        isActive: Boolean(r.is_active),
      }));
    }
    case 'db_create_marketplace_category': {
      const p = args.payload;
      const id = `mcat_${Date.now()}`;
      db.prepare(`
        INSERT INTO local_marketplace_categories (
          id, user_id, marketplace_code, external_id, xml_attribute_name, name_uk, name_en,
          full_path_uk, parent_external_id, default_commission_percent, default_fixed_fee,
          is_leaf, is_active, created_at, updated_at
        ) VALUES (?, 'usr_admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        id, p.marketplaceCode || 'ROZETKA', p.externalId, p.xmlAttributeName || 'rz_id',
        p.nameUk, p.nameEn || null, p.fullPathUk || null, p.parentExternalId || null,
        p.defaultCommissionPercent || 0, p.defaultFixedFee || 0, p.isLeaf === false ? 0 : 1,
        p.isActive === false ? 0 : 1,
      );
      return { id, ...p };
    }
    case 'db_update_marketplace_category': {
      const { id, payload: p } = args;
      const updates = [];
      const values = [];
      if (p.nameUk !== undefined) { updates.push('name_uk = ?'); values.push(p.nameUk); }
      if (p.defaultCommissionPercent !== undefined) { updates.push('default_commission_percent = ?'); values.push(p.defaultCommissionPercent); }
      if (p.defaultFixedFee !== undefined) { updates.push('default_fixed_fee = ?'); values.push(p.defaultFixedFee); }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      db.prepare(`UPDATE local_marketplace_categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      return db.prepare('SELECT * FROM local_marketplace_categories WHERE id = ?').get(id);
    }
    case 'db_import_marketplace_categories': {
      const items = args.items || [];
      const stmt = db.prepare(`
        INSERT INTO local_marketplace_categories (
          id, user_id, marketplace_code, external_id, xml_attribute_name, name_uk, name_en,
          full_path_uk, parent_external_id, default_commission_percent, default_fixed_fee,
          is_leaf, is_active, created_at, updated_at
        ) VALUES (?, 'usr_admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, marketplace_code, external_id) DO UPDATE SET
          name_uk = excluded.name_uk,
          full_path_uk = excluded.full_path_uk,
          default_commission_percent = excluded.default_commission_percent,
          updated_at = CURRENT_TIMESTAMP
      `);
      for (const it of items) {
        const id = `mcat_${it.marketplaceCode || 'ROZETKA'}_${it.externalId}`;
        stmt.run(
          id, it.marketplaceCode || 'ROZETKA', it.externalId, it.xmlAttributeName || 'rz_id',
          it.nameUk, it.nameEn || null, it.fullPathUk || null, it.parentExternalId || null,
          it.defaultCommissionPercent || 0, it.defaultFixedFee || 0, it.isLeaf === false ? 0 : 1,
        );
      }
      return { importedCount: items.length };
    }
    case 'db_auto_map_supplier_categories': {
      return { mappedCount: 0, categories: [] };
    }
    case 'db_get_supplier_category_marketplace_maps': {
      const ruleId = args?.supplierCategoryRuleId;
      let query = 'SELECT * FROM local_supplier_category_marketplace_maps';
      const params = [];
      if (ruleId) {
        query += ' WHERE supplier_category_rule_id = ?';
        params.push(ruleId);
      }
      const rows = db.prepare(query).all(...params);
      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        supplierCategoryRuleId: r.supplier_category_rule_id,
        marketplaceCode: r.marketplace_code,
        marketplaceCategoryId: r.marketplace_category_id,
        externalCategoryId: r.external_category_id,
        externalCategoryName: r.external_category_name,
        commissionPercent: r.commission_percent,
        fixedFee: r.fixed_fee,
      }));
    }
    case 'db_upsert_supplier_category_marketplace_map': {
      const p = args.payload;
      const id = `scmm_${p.supplierCategoryRuleId}_${p.marketplaceCode}`;
      db.prepare(`
        INSERT INTO local_supplier_category_marketplace_maps (
          id, user_id, supplier_category_rule_id, marketplace_code, marketplace_category_id,
          external_category_id, external_category_name, commission_percent, fixed_fee, created_at, updated_at
        ) VALUES (?, 'usr_admin', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, supplier_category_rule_id, marketplace_code) DO UPDATE SET
          external_category_id = excluded.external_category_id,
          external_category_name = excluded.external_category_name,
          commission_percent = excluded.commission_percent,
          fixed_fee = excluded.fixed_fee,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        id, p.supplierCategoryRuleId, p.marketplaceCode || 'ROZETKA', p.marketplaceCategoryId || null,
        p.externalCategoryId, p.externalCategoryName, p.commissionPercent || 0, p.fixedFee || 0,
      );
      return { id, ...p };
    }
    case 'db_delete_supplier_category_marketplace_map': {
      db.prepare('DELETE FROM local_supplier_category_marketplace_maps WHERE supplier_category_rule_id = ? AND marketplace_code = ?').run(args.supplierCategoryRuleId, args.marketplaceCode);
      return;
    }
    default:
      return undefined;
  }
}
