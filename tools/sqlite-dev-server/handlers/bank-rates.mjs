// @golden - SQLite Dev Server: Bank Exchange Rates
import { db } from '../db.mjs';

export function handleBankRates(command, args) {
  switch (command) {
    case 'db_get_bank_rates': {
      let query = 'SELECT * FROM local_bank_rates';
      const params = [];
      if (args?.currency) {
        query += ' WHERE currency = ?';
        params.push(args.currency);
      }
      query += ' ORDER BY bank_name ASC';
      const rows = db.prepare(query).all(...params);
      return rows.map((r) => ({
        id: r.id,
        bankId: r.bank_id,
        bankName: r.bank_name,
        badge: r.badge,
        logoUrl: r.logo_url,
        currency: r.currency,
        buyRate: r.buy_rate,
        sellRate: r.sell_rate,
        deltaNbu: r.delta_nbu,
        deltaPercent: r.delta_percent,
        updatedAt: r.updated_at,
      }));
    }
    case 'db_save_bank_rates': {
      const rates = args.rates || [];
      const stmt = db.prepare(`
        INSERT INTO local_bank_rates (
          id, bank_id, bank_name, badge, logo_url, currency,
          buy_rate, sell_rate, delta_nbu, delta_percent, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(bank_id, currency) DO UPDATE SET
          buy_rate = excluded.buy_rate,
          sell_rate = excluded.sell_rate,
          delta_nbu = excluded.delta_nbu,
          delta_percent = excluded.delta_percent,
          updated_at = CURRENT_TIMESTAMP
      `);
      for (const r of rates) {
        const id = `rate_${r.bankId}_${r.currency}`;
        stmt.run(id, r.bankId, r.bankName, r.badge || '', r.logoUrl || null, r.currency, r.buyRate, r.sellRate, r.deltaNbu || 0, r.deltaPercent || 0);
      }
      return { success: true };
    }
    default:
      return undefined;
  }
}
