// @golden - SQLite Dev Server: Export Channels & Rules
import { db } from '../db.mjs';

export function handleChannels(command, args) {
  switch (command) {
    case 'db_get_export_channels': {
      const rows = db.prepare('SELECT * FROM local_export_channels ORDER BY created_at DESC').all();
      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        marketplaceCode: r.marketplace_code,
        feedFormat: r.feed_format,
        slug: r.slug,
        exportUrl: r.export_url,
        commissionPercent: r.commission_percent,
        extraFixedCost: r.extra_fixed_cost,
        applyReverseMarkup: Boolean(r.apply_reverse_markup),
        isActive: Boolean(r.is_active),
        pricingRulesCount: r.pricing_rules_count,
        totalProductsCount: r.total_products_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
    case 'db_get_export_channel_by_id': {
      const r = db.prepare('SELECT * FROM local_export_channels WHERE id = ?').get(args.id);
      if (!r) return null;
      return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        marketplaceCode: r.marketplace_code,
        feedFormat: r.feed_format,
        slug: r.slug,
        exportUrl: r.export_url,
        commissionPercent: r.commission_percent,
        extraFixedCost: r.extra_fixed_cost,
        applyReverseMarkup: Boolean(r.apply_reverse_markup),
        isActive: Boolean(r.is_active),
        pricingRulesCount: r.pricing_rules_count,
        totalProductsCount: r.total_products_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }
    case 'db_create_export_channel': {
      const p = args.payload;
      const id = `chan_${Date.now()}`;
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const exportUrl = `http://localhost:5001/export/${slug}.xml`;
      db.prepare(`
        INSERT INTO local_export_channels (
          id, user_id, name, marketplace_code, feed_format, slug, export_url,
          commission_percent, extra_fixed_cost, apply_reverse_markup, is_active,
          pricing_rules_count, total_products_count, created_at, updated_at
        ) VALUES (?, 'usr_admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        id, p.name, p.marketplaceCode || 'ROZETKA', p.feedFormat || 'XML_ROZETKA', slug, exportUrl,
        p.commissionPercent ?? 10, p.extraFixedCost ?? 0, p.applyReverseMarkup === false ? 0 : 1,
        p.isActive === false ? 0 : 1,
      );
      return handleChannels('db_get_export_channel_by_id', { id });
    }
    case 'db_update_export_channel': {
      const { id, payload: p } = args;
      const updates = [];
      const values = [];
      if (p.name !== undefined) { updates.push('name = ?'); values.push(p.name); }
      if (p.commissionPercent !== undefined) { updates.push('commission_percent = ?'); values.push(p.commissionPercent); }
      if (p.extraFixedCost !== undefined) { updates.push('extra_fixed_cost = ?'); values.push(p.extraFixedCost); }
      if (p.applyReverseMarkup !== undefined) { updates.push('apply_reverse_markup = ?'); values.push(p.applyReverseMarkup ? 1 : 0); }
      if (p.isActive !== undefined) { updates.push('is_active = ?'); values.push(p.isActive ? 1 : 0); }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      db.prepare(`UPDATE local_export_channels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      return handleChannels('db_get_export_channel_by_id', { id });
    }
    case 'db_delete_export_channel': {
      db.prepare('DELETE FROM local_export_channel_pricing_rules WHERE channel_id = ?').run(args.id);
      const res = db.prepare('DELETE FROM local_export_channels WHERE id = ?').run(args.id);
      return res.changes > 0;
    }
    case 'db_get_export_pricing_rules': {
      const rows = db.prepare('SELECT * FROM local_export_channel_pricing_rules WHERE channel_id = ? ORDER BY priority DESC').all(args.channelId);
      return rows.map((r) => ({
        id: r.id,
        channelId: r.channel_id,
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
    case 'db_create_export_pricing_rule': {
      const { channelId, payload: p } = args;
      const id = `exp_rule_${Date.now()}`;
      db.prepare(`
        INSERT INTO local_export_channel_pricing_rules (
          id, channel_id, category_id, category_name_uk, min_price, max_price,
          margin_percent, fixed_markup, priority, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        id, channelId, p.categoryId || null, p.categoryNameUk || null, p.minPrice || 0,
        p.maxPrice || null, p.marginPercent || 0, p.fixedMarkup || 0, p.priority || 0,
        p.isActive === false ? 0 : 1,
      );
      return {
        id, channelId, categoryId: p.categoryId, categoryNameUk: p.categoryNameUk,
        minPrice: p.minPrice || 0, maxPrice: p.maxPrice, marginPercent: p.marginPercent || 0,
        fixedMarkup: p.fixedMarkup || 0, priority: p.priority || 0, isActive: p.isActive !== false,
      };
    }
    case 'db_delete_export_pricing_rule': {
      const res = db.prepare('DELETE FROM local_export_channel_pricing_rules WHERE id = ? AND channel_id = ?').run(args.ruleId, args.channelId);
      return res.changes > 0;
    }
    default:
      return undefined;
  }
}
