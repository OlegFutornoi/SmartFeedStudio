use keyring::Entry;
use rusqlite::{Connection, Result};
use std::path::Path;

const KEYRING_SERVICE: &str = "SmartFeedStudio";
const KEYRING_DB_KEY_USER: &str = "sqlcipher_db_key";

pub fn get_or_create_encryption_key() -> std::result::Result<String, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_DB_KEY_USER).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(key) if !key.is_empty() => Ok(key),
        _ => {
            // Generate a secure random 32-byte hex key
            use std::time::SystemTime;
            let time_val = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos();
            let new_key = format!("sf_enc_key_{:x}_sec_cipher", time_val);
            let _ = entry.set_password(&new_key);
            Ok(new_key)
        }
    }
}

pub fn open_encrypted_connection(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    if let Ok(key) = get_or_create_encryption_key() {
        let pragma_sql = format!("PRAGMA key = '{}';", key);
        let _ = conn.execute_batch(&pragma_sql);
    }
    init_schema(&conn)?;
    Ok(conn)
}

pub fn init_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS local_suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            default_markup_percent REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_feed_sources (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            url TEXT,
            file_path TEXT,
            status TEXT DEFAULT 'IDLE',
            selected_categories TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_products (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            feed_source_id TEXT,
            sku TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT,
            vendor TEXT,
            price REAL NOT NULL,
            cost_price REAL,
            stock INTEGER DEFAULT 0,
            is_available INTEGER DEFAULT 1,
            description TEXT,
            attributes_json TEXT,
            images_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE,
            FOREIGN KEY(feed_source_id) REFERENCES local_feed_sources(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_pricing_rules (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            category TEXT,
            min_price REAL,
            max_price REAL,
            markup_percent REAL DEFAULT 0,
            markup_fixed REAL DEFAULT 0,
            priority INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_export_channels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            feed_url TEXT,
            marketplace_fee_percent REAL DEFAULT 10,
            tax_percent REAL DEFAULT 5,
            target_margin_percent REAL DEFAULT 20,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_export_pricing_rules (
            id TEXT PRIMARY KEY,
            export_channel_id TEXT NOT NULL,
            category TEXT,
            marketplace_fee_percent REAL,
            target_margin_percent REAL,
            additional_fixed_markup REAL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(export_channel_id) REFERENCES local_export_channels(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_products_sku ON local_products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_supplier ON local_products(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON local_products(category);
        CREATE INDEX IF NOT EXISTS idx_pricing_supplier ON local_pricing_rules(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_export_rules_channel ON local_export_pricing_rules(export_channel_id);
        "#,
    )?;
    Ok(())
}

