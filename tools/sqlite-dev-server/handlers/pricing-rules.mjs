// @golden - SQLite Dev Server: Pricing Rules & Simulation
import { db } from '../db.mjs';

export function handlePricingRules(command, args) {
  switch (command) {
    case 'db_get_pricing_rules': {
      const rows = db.prepare('SELECT * FROM local_supplier_pricing_rules WHERE supplier_id = ? ORDER BY priority DESC').all(args.supplierId);
      return rows.map((r) => ({
        id: r.id,
        supplierId: r.supplier_id,
        categoryId: r.category_id,
        categoryNameUk: r.category_name_uk,
        minPrice: r.min_price,
        maxPrice: r.max_price,
        marginPercent: r.margin_percent,
        fixedMarkup: r.fixed_markup,
        priority: r.priority,
        isActive: Boolean(r.is_active),
      }));
    }
    case 'db_create_pricing_rule': {
      const { supplierId, payload: p } = args;
      const id = `rule_${Date.now()}`;
      db.prepare(`
        INSERT INTO local_supplier_pricing_rules (
          id, supplier_id, category_id, category_name_uk, min_price, max_price,
          margin_percent, fixed_markup, priority, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        id, supplierId, p.categoryId || null, p.categoryNameUk || null, p.minPrice || 0,
        p.maxPrice || null, p.marginPercent || 0, p.fixedMarkup || 0, p.priority || 0,
        p.isActive === false ? 0 : 1,
      );
      return {
        id,
        supplierId,
        categoryId: p.categoryId,
        categoryNameUk: p.categoryNameUk,
        minPrice: p.minPrice || 0,
        maxPrice: p.maxPrice,
        marginPercent: p.marginPercent || 0,
        fixedMarkup: p.fixedMarkup || 0,
        priority: p.priority || 0,
        isActive: p.isActive !== false,
      };
    }
    case 'db_update_pricing_rule': {
      const { supplierId, ruleId, payload: p } = args;
      const updates = [];
      const values = [];
      if (p.minPrice !== undefined) { updates.push('min_price = ?'); values.push(p.minPrice); }
      if (p.maxPrice !== undefined) { updates.push('max_price = ?'); values.push(p.maxPrice); }
      if (p.marginPercent !== undefined) { updates.push('margin_percent = ?'); values.push(p.marginPercent); }
      if (p.fixedMarkup !== undefined) { updates.push('fixed_markup = ?'); values.push(p.fixedMarkup); }
      if (p.priority !== undefined) { updates.push('priority = ?'); values.push(p.priority); }
      if (p.isActive !== undefined) { updates.push('is_active = ?'); values.push(p.isActive ? 1 : 0); }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(ruleId, supplierId);
      db.prepare(`UPDATE local_supplier_pricing_rules SET ${updates.join(', ')} WHERE id = ? AND supplier_id = ?`).run(...values);
      const row = db.prepare('SELECT * FROM local_supplier_pricing_rules WHERE id = ?').get(ruleId);
      return {
        id: row.id,
        supplierId: row.supplier_id,
        categoryId: row.category_id,
        categoryNameUk: row.category_name_uk,
        minPrice: row.min_price,
        maxPrice: row.max_price,
        marginPercent: row.margin_percent,
        fixedMarkup: row.fixed_markup,
        priority: row.priority,
        isActive: Boolean(row.is_active),
      };
    }
    case 'db_delete_pricing_rule': {
      const res = db.prepare('DELETE FROM local_supplier_pricing_rules WHERE id = ? AND supplier_id = ?').run(args.ruleId, args.supplierId);
      return res.changes > 0;
    }
    case 'db_simulate_price': {
      const { payload } = args;
      const cost = payload.costPrice || 100;
      const margin = payload.marginPercent || 15;
      const fixed = payload.fixedMarkup || 0;
      const commission = payload.commissionPercent || 10;
      const baseOut = cost * (1 + margin / 100) + fixed;
      const finalPrice = Math.round(baseOut / (1 - commission / 100));
      return {
        originalCostPrice: cost,
        calculatedPrice: finalPrice,
        appliedRules: [],
        marginPercent: margin,
        fixedMarkup: fixed,
        commissionAmount: Math.round(finalPrice * (commission / 100)),
        netProfit: Math.round(finalPrice - cost - finalPrice * (commission / 100)),
      };
    }
    default:
      return undefined;
  }
}
