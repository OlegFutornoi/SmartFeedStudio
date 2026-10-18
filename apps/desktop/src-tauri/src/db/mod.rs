use keyring::Entry;
use rusqlite::{Connection, Result};
use std::path::Path;

pub mod schema;
pub mod suppliers;
pub mod feeds;
pub mod feed_collision;
pub mod products;

pub use schema::*;
pub use suppliers::*;
pub use feeds::*;
pub use feed_collision::*;
pub use products::*;

const KEYRING_SERVICE: &str = "SmartFeedStudio";
const KEYRING_DB_KEY_USER: &str = "sqlcipher_db_key";

pub fn get_or_create_encryption_key() -> std::result::Result<String, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_DB_KEY_USER).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(key) if !key.is_empty() => Ok(key),
        _ => {
            use std::time::SystemTime;
            let time_val = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos();
            let rand_suffix = uuid::Uuid::new_v4().to_string().replace("-", "");
            let new_key = format!("sf_enc_key_{:x}_{}_sec_cipher", time_val, rand_suffix);
            let _ = entry.set_password(&new_key);
            Ok(new_key)
        }
    }
}

pub fn open_encrypted_connection(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    match get_or_create_encryption_key() {
        Ok(key) => {
            let pragma_sql = format!("PRAGMA key = '{}';", key);
            if let Err(e) = conn.execute_batch(&pragma_sql) {
                eprintln!("[Rust SQLite] Notice: PRAGMA key execution: {}", e);
            }
        }
        Err(e) => {
            eprintln!("[Rust SQLite] Keyring retrieval warning: {}", e);
        }
    }
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    init_schema(&conn)?;
    Ok(conn)
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalCounters {
    pub id: String,
    pub suppliers_count: u32,
    pub feeds_count: u32,
    pub products_count: u32,
}

pub fn sync_counters(conn: &Connection) -> Result<()> {
    let suppliers: u32 = conn.query_row("SELECT COUNT(*) FROM local_suppliers", [], |row| row.get(0)).unwrap_or(0);
    let feeds: u32 = conn.query_row("SELECT COUNT(*) FROM local_feed_sources", [], |row| row.get(0)).unwrap_or(0);
    let products: u32 = conn.query_row("SELECT COUNT(*) FROM local_products", [], |row| row.get(0)).unwrap_or(0);

    conn.execute(
        "INSERT INTO local_counters (id, suppliers_count, feeds_count, products_count, updated_at)
         VALUES ('main', ?1, ?2, ?3, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
            suppliers_count = excluded.suppliers_count,
            feeds_count = excluded.feeds_count,
            products_count = excluded.products_count,
            updated_at = CURRENT_TIMESTAMP",
        (suppliers, feeds, products),
    )?;

    Ok(())
}

pub fn get_counters(conn: &Connection) -> Result<LocalCounters> {
    let _ = sync_counters(conn);
    
    conn.query_row(
        "SELECT id, suppliers_count, feeds_count, products_count FROM local_counters WHERE id = 'main'",
        [],
        |row| {
            Ok(LocalCounters {
                id: row.get(0)?,
                suppliers_count: row.get(1)?,
                feeds_count: row.get(2)?,
                products_count: row.get(3)?,
            })
        },
    ).or_else(|_| {
        Ok(LocalCounters {
            id: "main".to_string(),
            suppliers_count: 0,
            feeds_count: 0,
            products_count: 0,
        })
    })
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalCountersSummary {
    pub total_suppliers: u32,
    pub total_feeds: u32,
    pub total_products: u32,
    pub total_rules: u32,
    pub feeds_by_supplier_id: std::collections::HashMap<String, u32>,
    pub products_by_supplier_id: std::collections::HashMap<String, u32>,
}

pub fn get_counters_summary(conn: &Connection) -> Result<LocalCountersSummary> {
    let _ = sync_counters(conn);

    let total_suppliers: u32 = conn
        .query_row("SELECT COUNT(*) FROM local_suppliers", [], |row| row.get(0))
        .unwrap_or(0);
    let total_feeds: u32 = conn
        .query_row("SELECT COUNT(*) FROM local_feed_sources", [], |row| row.get(0))
        .unwrap_or(0);
    let total_products: u32 = conn
        .query_row("SELECT COUNT(*) FROM local_products", [], |row| row.get(0))
        .unwrap_or(0);
    let total_rules: u32 = conn
        .query_row(
            "SELECT COUNT(*) FROM local_supplier_pricing_rules WHERE supplier_id IN (SELECT id FROM local_suppliers)",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let mut feeds_by_supplier_id = std::collections::HashMap::new();
    if let Ok(mut feed_stmt) = conn.prepare(
        "SELECT supplier_id, COUNT(*) FROM local_feed_sources WHERE supplier_id IS NOT NULL AND supplier_id != '' GROUP BY supplier_id"
    ) {
        if let Ok(feed_rows) = feed_stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, u32>(1)?))
        }) {
            for row in feed_rows.flatten() {
                feeds_by_supplier_id.insert(row.0, row.1);
            }
        }
    }

    let mut products_by_supplier_id = std::collections::HashMap::new();
    if let Ok(mut prod_stmt) = conn.prepare(
        "SELECT supplier_id, COUNT(*) FROM local_products WHERE supplier_id IS NOT NULL AND supplier_id != '' GROUP BY supplier_id"
    ) {
        if let Ok(prod_rows) = prod_stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, u32>(1)?))
        }) {
            for row in prod_rows.flatten() {
                products_by_supplier_id.insert(row.0, row.1);
            }
        }
    }

    Ok(LocalCountersSummary {
        total_suppliers,
        total_feeds,
        total_products,
        total_rules,
        feeds_by_supplier_id,
        products_by_supplier_id,
    })
}
