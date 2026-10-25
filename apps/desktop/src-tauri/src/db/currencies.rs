use crate::models::LocalBankRateDto;
use rusqlite::{params, Connection, Result};

pub fn get_bank_rates(conn: &Connection, currency: Option<&str>) -> Result<Vec<LocalBankRateDto>> {
    let mut sql = "SELECT id, bank_id, bank_name, badge, logo_url, currency, buy_rate, sell_rate, delta_nbu, delta_percent, updated_at FROM local_bank_rates".to_string();
    if let Some(curr) = currency {
        sql.push_str(" WHERE currency = ?1 ORDER BY sell_rate ASC");
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map([curr], |row| {
            Ok(LocalBankRateDto {
                id: row.get(0)?,
                bank_id: row.get(1)?,
                bank_name: row.get(2)?,
                badge: row.get(3)?,
                logo_url: row.get(4)?,
                currency: row.get(5)?,
                buy_rate: row.get(6)?,
                sell_rate: row.get(7)?,
                delta_nbu: row.get(8)?,
                delta_percent: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        let mut rates = Vec::new();
        for r in rows {
            rates.push(r?);
        }
        Ok(rates)
    } else {
        sql.push_str(" ORDER BY currency ASC, sell_rate ASC");
        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map([], |row| {
            Ok(LocalBankRateDto {
                id: row.get(0)?,
                bank_id: row.get(1)?,
                bank_name: row.get(2)?,
                badge: row.get(3)?,
                logo_url: row.get(4)?,
                currency: row.get(5)?,
                buy_rate: row.get(6)?,
                sell_rate: row.get(7)?,
                delta_nbu: row.get(8)?,
                delta_percent: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        let mut rates = Vec::new();
        for r in rows {
            rates.push(r?);
        }
        Ok(rates)
    }
}

pub fn upsert_bank_rates(conn: &Connection, rates: &[LocalBankRateDto]) -> Result<()> {
    let tx = conn.unchecked_transaction()?;
    {
        let mut stmt = tx.prepare(
            "INSERT INTO local_bank_rates (id, bank_id, bank_name, badge, logo_url, currency, buy_rate, sell_rate, delta_nbu, delta_percent, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(id) DO UPDATE SET
                bank_name = excluded.bank_name,
                badge = excluded.badge,
                logo_url = excluded.logo_url,
                buy_rate = excluded.buy_rate,
                sell_rate = excluded.sell_rate,
                delta_nbu = excluded.delta_nbu,
                delta_percent = excluded.delta_percent,
                updated_at = excluded.updated_at",
        )?;

        for r in rates {
            let id = if r.id.is_empty() {
                format!("{}_{}", r.bank_id, r.currency)
            } else {
                r.id.clone()
            };
            stmt.execute(params![
                id,
                r.bank_id,
                r.bank_name,
                r.badge,
                r.logo_url,
                r.currency,
                r.buy_rate,
                r.sell_rate,
                r.delta_nbu,
                r.delta_percent,
                r.updated_at
            ])?;
        }
    }
    tx.commit()?;
    Ok(())
}
