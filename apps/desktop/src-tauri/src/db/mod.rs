use keyring::Entry;
use rusqlite::{Connection, Result};
use std::path::Path;

pub mod suppliers;
pub mod feeds;
pub mod products;

pub use suppliers::*;
pub use feeds::*;
pub use products::*;

const KEYRING_SERVICE: &str = "SmartFeedStudio";
const KEYRING_DB_KEY_USER: &str = "sqlcipher_db_key";

pub fn get_or_create_encryption_key() -> std::result::Result<String, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_DB_KEY_USER).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(key) if !key.is_empty() => Ok(key),
        _ => {
            // Generate a secure random 32-byte hex key with CSPRNG entropy
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
    if let Ok(key) = get_or_create_encryption_key() {
        let pragma_sql = format!("PRAGMA key = '{}';", key);
        let _ = conn.execute_batch(&pragma_sql);
    }
    let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");
    init_schema(&conn)?;
    Ok(conn)
}

pub fn init_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS local_suppliers (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            contact_phone TEXT,
            contact_email TEXT,
            website TEXT,
            notes TEXT,
            logo_url TEXT,
            base_currency TEXT DEFAULT 'UAH',
            target_currency TEXT DEFAULT 'UAH',
            exchange_rate_mode TEXT DEFAULT 'MANUAL',
            exchange_rate REAL DEFAULT 1.0,
            currency_buffer_percent REAL DEFAULT 0,
            price_rounding TEXT DEFAULT 'NONE',
            default_margin_percent REAL DEFAULT 0,
            default_fixed_markup REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS local_supplier_categories (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            feed_category_id TEXT NOT NULL,
            name TEXT NOT NULL,
            parent_id TEXT,
            is_active INTEGER DEFAULT 1,
            margin_percent REAL,
            fixed_markup REAL,
            product_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_supplier_pricing_rules (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            category_id TEXT,
            category_name_uk TEXT,
            min_price REAL DEFAULT 0,
            max_price REAL,
            margin_percent REAL DEFAULT 0,
            fixed_markup REAL DEFAULT 0,
            priority INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_feed_sources (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            file_format TEXT NOT NULL,
            source_url TEXT,
            s3_file_key TEXT,
            auth_header_name TEXT,
            auth_header_value TEXT,
            sync_interval_hours INTEGER DEFAULT 0,
            auto_update_prices INTEGER DEFAULT 1,
            auto_update_stocks INTEGER DEFAULT 1,
            auto_create_new_products INTEGER DEFAULT 1,
            mapping_rules TEXT,
            last_synced_at TEXT,
            last_sync_status TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_products (
            id TEXT PRIMARY KEY,
            catalog_id TEXT NOT NULL,
            supplier_id TEXT NOT NULL,
            feed_source_id TEXT,
            category_id TEXT,
            category_name_uk TEXT,
            sku TEXT NOT NULL,
            external_id TEXT,
            barcode TEXT,
            vendor_code TEXT,
            title_uk TEXT NOT NULL,
            title_en TEXT,
            description_uk TEXT,
            description_en TEXT,
            vendor TEXT,
            cost_price REAL DEFAULT 0,
            price REAL NOT NULL,
            old_price REAL,
            currency TEXT DEFAULT 'UAH',
            stock_quantity INTEGER DEFAULT 0,
            in_stock INTEGER DEFAULT 1,
            status TEXT DEFAULT 'ACTIVE',
            raw_payload TEXT,
            attributes_json TEXT,
            images_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE,
            FOREIGN KEY(feed_source_id) REFERENCES local_feed_sources(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_counters (
            id TEXT PRIMARY KEY,
            suppliers_count INTEGER DEFAULT 0,
            feeds_count INTEGER DEFAULT 0,
            products_count INTEGER DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_sku ON local_products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_supplier ON local_products(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_products_catalog ON local_products(catalog_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON local_products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_category_name ON local_products(category_name_uk);
        CREATE INDEX IF NOT EXISTS idx_feeds_supplier ON local_feed_sources(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_supplier_categories_supplier ON local_supplier_categories(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_supplier_pricing_rules_supplier ON local_supplier_pricing_rules(supplier_id);
        "#,
    )?;

    // Migrations for existing databases
    let _ = conn.execute_batch("
        ALTER TABLE local_suppliers ADD COLUMN logo_url TEXT;
        ALTER TABLE local_suppliers ADD COLUMN base_currency TEXT DEFAULT 'UAH';
        ALTER TABLE local_suppliers ADD COLUMN target_currency TEXT DEFAULT 'UAH';
        ALTER TABLE local_suppliers ADD COLUMN exchange_rate_mode TEXT DEFAULT 'MANUAL';
        ALTER TABLE local_suppliers ADD COLUMN exchange_rate REAL DEFAULT 1.0;
        ALTER TABLE local_suppliers ADD COLUMN currency_buffer_percent REAL DEFAULT 0;
        ALTER TABLE local_suppliers ADD COLUMN price_rounding TEXT DEFAULT 'NONE';
    ");
    // Run migration for existing databases to guarantee category_name_uk exists
    let _ = conn.execute_batch("ALTER TABLE local_products ADD COLUMN category_name_uk TEXT;");
    // Link any orphaned products to the existing supplier if only 1 supplier exists
    let _ = conn.execute_batch("
        UPDATE local_products 
        SET supplier_id = (SELECT id FROM local_suppliers LIMIT 1)
        WHERE (supplier_id IS NULL OR supplier_id = '' OR supplier_id NOT IN (SELECT id FROM local_suppliers))
          AND (SELECT COUNT(*) FROM local_suppliers) = 1;
    ");
    // Clean up any orphaned products where their feed source was deleted
    let _ = conn.execute_batch("
        DELETE FROM local_product_images WHERE product_id IN (
            SELECT id FROM local_products 
            WHERE feed_source_id IS NOT NULL AND feed_source_id != '' 
              AND feed_source_id NOT IN (SELECT id FROM local_feed_sources)
        );
        DELETE FROM local_products 
        WHERE feed_source_id IS NOT NULL AND feed_source_id != '' 
          AND feed_source_id NOT IN (SELECT id FROM local_feed_sources);
    ");
    crate::images::db::init_images_schema(conn)?;
    Ok(())
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
    // Ensure counters are in sync before fetching
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
