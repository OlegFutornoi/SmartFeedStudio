// @golden - SQLite Dev Server: Suppliers
import { db } from '../db.mjs';
import { computeCountersSummary } from './counters.mjs';

export function mapSupplierRow(s, summary) {
  if (!s) return null;
  const feedsCount = summary.feedsBySupplierId[s.id] || 0;
  const productsCount = feedsCount === 0 ? 0 : (summary.productsBySupplierId[s.id] || 0);
  const categoriesCount = feedsCount === 0 || productsCount === 0 ? 0 : (summary.categoriesBySupplierId?.[s.id] || 0);
  const activeCategoriesCount = feedsCount === 0 || productsCount === 0 ? 0 : (summary.activeCategoriesBySupplierId?.[s.id] || 0);

  return {
    id: s.id,
    userId: s.user_id || 'usr_admin',
    name: s.name,
    code: s.code,
    contactPhone: s.contact_phone || undefined,
    contactEmail: s.contact_email || undefined,
    website: s.website || undefined,
    notes: s.notes || undefined,
    logoUrl: s.logo_url || undefined,
    legalName: s.legal_name || undefined,
    taxId: s.tax_id || undefined,
    industry: s.industry || undefined,
    segment: s.segment || undefined,
    managerName: s.manager_name || undefined,
    managerPosition: s.manager_position || undefined,
    managerPhone: s.manager_phone || undefined,
    managerEmail: s.manager_email || undefined,
    managerTelegram: s.manager_telegram || undefined,
    country: s.country || undefined,
    city: s.city || undefined,
    address: s.address || undefined,
    postcode: s.postcode || undefined,
    defaultMarginPercent: s.default_margin_percent ?? 0,
    defaultFixedMarkup: s.default_fixed_markup ?? 0,
    isActive: Boolean(s.is_active),
    baseCurrency: s.base_currency || 'UAH',
    targetCurrency: s.target_currency || 'UAH',
    exchangeRateMode: s.exchange_rate_mode || 'MANUAL',
    exchangeRate: s.exchange_rate ?? 1.0,
    currencyBufferPercent: s.currency_buffer_percent ?? 0,
    priceRounding: s.price_rounding || 'NONE',
    customRoundingRules: JSON.parse(s.custom_rounding_rules || '[]'),
    selectedBankId: s.selected_bank_id || null,
    feedsCount,
    productsCount,
    categoriesCount,
    activeCategoriesCount,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

export function handleSuppliers(command, args) {
  switch (command) {
    case 'db_get_suppliers': {
      const search = (args?.search || '').trim().toLowerCase();
      let query = 'SELECT * FROM local_suppliers';
      const params = [];
      if (search) {
        query += ' WHERE LOWER(name) LIKE ? OR LOWER(code) LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY created_at DESC';
      const rows = db.prepare(query).all(...params);
      const summary = computeCountersSummary();
      return rows.map((r) => mapSupplierRow(r, summary));
    }
    case 'db_get_supplier_by_id': {
      const row = db.prepare('SELECT * FROM local_suppliers WHERE id = ?').get(args.id);
      if (!row) return null;
      const summary = computeCountersSummary();
      return mapSupplierRow(row, summary);
    }
    case 'db_create_supplier': {
      const p = args.payload || {};
      const id = p.id || `sup_${Date.now()}`;
      const code = p.code || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const stmt = db.prepare(`
        INSERT INTO local_suppliers (
          id, organization_id, user_id, name, code, contact_phone, contact_email, website, notes, logo_url,
          legal_name, tax_id, industry, segment, manager_name, manager_position, manager_phone, manager_email,
          manager_telegram, country, city, address, postcode, default_margin_percent, default_fixed_markup,
          is_active, base_currency, target_currency, exchange_rate_mode, exchange_rate, currency_buffer_percent,
          price_rounding, custom_rounding_rules, selected_bank_id, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `);
      stmt.run(
        id, p.organizationId || null, p.userId || 'usr_admin', p.name, code, p.contactPhone || null,
        p.contactEmail || null, p.website || null, p.notes || null, p.logoUrl || null, p.legalName || null,
        p.taxId || null, p.industry || null, p.segment || null, p.managerName || null, p.managerPosition || null,
        p.managerPhone || null, p.managerEmail || null, p.managerTelegram || null, p.country || null,
        p.city || null, p.address || null, p.postcode || null, p.defaultMarginPercent || 0, p.defaultFixedMarkup || 0,
        p.isActive === false ? 0 : 1, p.baseCurrency || 'UAH', p.targetCurrency || 'UAH', p.exchangeRateMode || 'MANUAL',
        p.exchangeRate || 1.0, p.currencyBufferPercent || 0, p.priceRounding || 'NONE',
        JSON.stringify(p.customRoundingRules || []), p.selectedBankId || null,
      );
      const row = db.prepare('SELECT * FROM local_suppliers WHERE id = ?').get(id);
      const summary = computeCountersSummary();
      return mapSupplierRow(row, summary);
    }
    case 'db_update_supplier': {
      const { id, payload: p } = args;
      const updates = [];
      const values = [];
      const textFields = [
        ['name', p.name], ['code', p.code], ['contact_phone', p.contactPhone], ['contact_email', p.contactEmail],
        ['website', p.website], ['notes', p.notes], ['logo_url', p.logoUrl], ['legal_name', p.legalName],
        ['tax_id', p.taxId], ['industry', p.industry], ['segment', p.segment], ['manager_name', p.managerName],
        ['manager_position', p.managerPosition], ['manager_phone', p.managerPhone], ['manager_email', p.managerEmail],
        ['manager_telegram', p.managerTelegram], ['country', p.country], ['city', p.city], ['address', p.address],
        ['postcode', p.postcode], ['base_currency', p.baseCurrency], ['target_currency', p.targetCurrency],
        ['exchange_rate_mode', p.exchangeRateMode], ['price_rounding', p.priceRounding], ['selected_bank_id', p.selectedBankId],
      ];
      for (const [col, val] of textFields) {
        if (val !== undefined) { updates.push(`${col} = ?`); values.push(val); }
      }
      if (p.defaultMarginPercent !== undefined) { updates.push('default_margin_percent = ?'); values.push(p.defaultMarginPercent); }
      if (p.defaultFixedMarkup !== undefined) { updates.push('default_fixed_markup = ?'); values.push(p.defaultFixedMarkup); }
      if (p.isActive !== undefined) { updates.push('is_active = ?'); values.push(p.isActive ? 1 : 0); }
      if (p.exchangeRate !== undefined) { updates.push('exchange_rate = ?'); values.push(p.exchangeRate); }
      if (p.currencyBufferPercent !== undefined) { updates.push('currency_buffer_percent = ?'); values.push(p.currencyBufferPercent); }
      if (p.customRoundingRules !== undefined) { updates.push('custom_rounding_rules = ?'); values.push(JSON.stringify(p.customRoundingRules)); }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      db.prepare(`UPDATE local_suppliers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const row = db.prepare('SELECT * FROM local_suppliers WHERE id = ?').get(id);
      const summary = computeCountersSummary();
      return mapSupplierRow(row, summary);
    }
    case 'db_delete_supplier': {
      db.prepare('DELETE FROM local_products WHERE supplier_id = ?').run(args.id);
      db.prepare('DELETE FROM local_feed_sources WHERE supplier_id = ?').run(args.id);
      db.prepare('DELETE FROM local_supplier_categories WHERE supplier_id = ?').run(args.id);
      db.prepare('DELETE FROM local_supplier_pricing_rules WHERE supplier_id = ?').run(args.id);
      db.prepare('DELETE FROM local_supplier_sync_settings WHERE supplier_id = ?').run(args.id);
      db.prepare('DELETE FROM local_supplier_sync_logs WHERE supplier_id = ?').run(args.id);
      db.prepare('DELETE FROM local_suppliers WHERE id = ?').run(args.id);
      return true;
    }
    default:
      return undefined;
  }
}
