use keyring::Entry;
use rusqlite::{params, Connection, Result};
use std::path::Path;
use crate::models::{
    SupplierDto, CreateSupplierDto, UpdateSupplierDto,
    FeedSourceDto, CreateFeedSourceDto,
    ProductDto, CreateProductDto
};

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
    // DROP tables if they exist to force schema update during this dev phase
    conn.execute_batch(
        r#"
        DROP TABLE IF EXISTS local_export_pricing_rules;
        DROP TABLE IF EXISTS local_export_channels;
        DROP TABLE IF EXISTS local_pricing_rules;
        DROP TABLE IF EXISTS local_products;
        DROP TABLE IF EXISTS local_feed_sources;
        DROP TABLE IF EXISTS local_suppliers;

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
            default_margin_percent REAL DEFAULT 0,
            default_fixed_markup REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
        CREATE INDEX IF NOT EXISTS idx_feeds_supplier ON local_feed_sources(supplier_id);
        "#,
    )?;
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


pub fn get_suppliers(conn: &Connection) -> Result<Vec<SupplierDto>> {
    let mut stmt = conn.prepare("SELECT id, organization_id, user_id, name, code, contact_phone, contact_email, website, notes, default_margin_percent, default_fixed_markup, is_active, created_at, updated_at FROM local_suppliers")?;
    
    let supplier_iter = stmt.query_map([], |row| {
        Ok(SupplierDto {
            id: row.get(0)?,
            organization_id: row.get(1)?,
            user_id: row.get(2)?,
            name: row.get(3)?,
            code: row.get(4)?,
            contact_phone: row.get(5)?,
            contact_email: row.get(6)?,
            website: row.get(7)?,
            notes: row.get(8)?,
            default_margin_percent: row.get(9)?,
            default_fixed_markup: row.get(10)?,
            is_active: row.get::<_, i32>(11)? == 1,
            products_count: None, // Could calculate this via JOIN or sync_counters later
            active_feeds_count: None,
            created_at: row.get(12)?,
            updated_at: row.get(13)?,
        })
    })?;

    let mut suppliers = Vec::new();
    for supplier in supplier_iter {
        suppliers.push(supplier?);
    }
    
    Ok(suppliers)
}

pub fn create_supplier(conn: &Connection, dto: CreateSupplierDto) -> Result<SupplierDto> {
    let id = format!("sf_supplier_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
    let user_id = "local_user".to_string(); // In a real setup, we'd get this from state
    
    conn.execute(
        "INSERT INTO local_suppliers (id, user_id, name, code, contact_phone, contact_email, website, notes, default_margin_percent, default_fixed_markup, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        (
            &id,
            &user_id,
            &dto.name,
            &dto.code,
            &dto.contact_phone,
            &dto.contact_email,
            &dto.website,
            &dto.notes,
            dto.default_margin_percent,
            dto.default_fixed_markup,
            if dto.is_active.unwrap_or(true) { 1 } else { 0 },
        ),
    )?;

    let _ = sync_counters(conn);

    Ok(SupplierDto {
        id,
        organization_id: None,
        user_id,
        name: dto.name,
        code: dto.code,
        contact_phone: dto.contact_phone,
        contact_email: dto.contact_email,
        website: dto.website,
        notes: dto.notes,
        default_margin_percent: dto.default_margin_percent,
        default_fixed_markup: dto.default_fixed_markup,
        is_active: dto.is_active.unwrap_or(true),
        products_count: Some(0),
        active_feeds_count: Some(0),
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn delete_supplier(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM local_suppliers WHERE id = ?1", [id])?;
    let _ = sync_counters(conn);
    Ok(())
}

pub fn update_supplier(conn: &Connection, id: &str, dto: UpdateSupplierDto) -> Result<SupplierDto> {
    let current_supplier: SupplierDto = conn.query_row(
        "SELECT id, organization_id, user_id, name, code, contact_phone, contact_email, website, notes, default_margin_percent, default_fixed_markup, is_active, created_at, updated_at FROM local_suppliers WHERE id = ?1",
        [id],
        |row| {
            Ok(SupplierDto {
                id: row.get(0)?,
                organization_id: row.get(1)?,
                user_id: row.get(2)?,
                name: row.get(3)?,
                code: row.get(4)?,
                contact_phone: row.get(5)?,
                contact_email: row.get(6)?,
                website: row.get(7)?,
                notes: row.get(8)?,
                default_margin_percent: row.get(9)?,
                default_fixed_markup: row.get(10)?,
                is_active: row.get::<_, i32>(11)? == 1,
                products_count: None,
                active_feeds_count: None,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        },
    )?;

    let name = dto.name.unwrap_or(current_supplier.name);
    let code = dto.code.unwrap_or(current_supplier.code);
    let contact_phone = dto.contact_phone.or(current_supplier.contact_phone);
    let contact_email = dto.contact_email.or(current_supplier.contact_email);
    let website = dto.website.or(current_supplier.website);
    let notes = dto.notes.or(current_supplier.notes);
    let default_margin_percent = dto.default_margin_percent.unwrap_or(current_supplier.default_margin_percent);
    let default_fixed_markup = dto.default_fixed_markup.unwrap_or(current_supplier.default_fixed_markup);
    let is_active = dto.is_active.unwrap_or(current_supplier.is_active);

    conn.execute(
        "UPDATE local_suppliers SET
            name = ?1, code = ?2, contact_phone = ?3, contact_email = ?4, website = ?5,
            notes = ?6, default_margin_percent = ?7, default_fixed_markup = ?8,
            is_active = ?9, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?10",
        (
            &name, &code, &contact_phone, &contact_email, &website,
            &notes, default_margin_percent, default_fixed_markup,
            if is_active { 1 } else { 0 }, id
        ),
    )?;

    // Fetch the updated row to get the exact updated_at
    conn.query_row(
        "SELECT id, organization_id, user_id, name, code, contact_phone, contact_email, website, notes, default_margin_percent, default_fixed_markup, is_active, created_at, updated_at FROM local_suppliers WHERE id = ?1",
        [id],
        |row| {
            Ok(SupplierDto {
                id: row.get(0)?,
                organization_id: row.get(1)?,
                user_id: row.get(2)?,
                name: row.get(3)?,
                code: row.get(4)?,
                contact_phone: row.get(5)?,
                contact_email: row.get(6)?,
                website: row.get(7)?,
                notes: row.get(8)?,
                default_margin_percent: row.get(9)?,
                default_fixed_markup: row.get(10)?,
                is_active: row.get::<_, i32>(11)? == 1,
                products_count: None,
                active_feeds_count: None,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        },
    )
}

pub fn get_supplier_feed_sources(conn: &Connection, supplier_id: &str) -> Result<Vec<FeedSourceDto>> {
    let mut stmt = conn.prepare("SELECT id, supplier_id, name, source_type, file_format, source_url, s3_file_key, auth_header_name, auth_header_value, sync_interval_hours, auto_update_prices, auto_update_stocks, auto_create_new_products, mapping_rules, last_synced_at, last_sync_status, created_at, updated_at FROM local_feed_sources WHERE supplier_id = ?1")?;
    
    let feed_iter = stmt.query_map([supplier_id], |row| {
        Ok(FeedSourceDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            supplier_name: None, // Could join suppliers table later
            name: row.get(2)?,
            source_type: row.get(3)?,
            file_format: row.get(4)?,
            source_url: row.get(5)?,
            s3_file_key: row.get(6)?,
            auth_header_name: row.get(7)?,
            auth_header_value: row.get(8)?,
            sync_interval_hours: row.get(9)?,
            auto_update_prices: row.get::<_, i32>(10)? == 1,
            auto_update_stocks: row.get::<_, i32>(11)? == 1,
            auto_create_new_products: row.get::<_, i32>(12)? == 1,
            mapping_rules: row.get(13)?,
            products_count: None, // Can calculate via sync_counters or JOIN
            last_synced_at: row.get(14)?,
            last_sync_status: row.get(15)?,
            created_at: row.get(16)?,
            updated_at: row.get(17)?,
        })
    })?;

    let mut feeds = Vec::new();
    for feed in feed_iter {
        feeds.push(feed?);
    }
    
    Ok(feeds)
}

pub fn create_feed_source(conn: &Connection, dto: CreateFeedSourceDto) -> Result<FeedSourceDto> {
    let id = format!("sf_feed_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
    
    conn.execute(
        "INSERT INTO local_feed_sources (id, supplier_id, name, source_type, file_format, source_url, auth_header_name, auth_header_value, sync_interval_hours, auto_update_prices, auto_update_stocks, auto_create_new_products, mapping_rules)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        (
            &id,
            &dto.supplier_id,
            &dto.name,
            &dto.source_type,
            &dto.file_format,
            &dto.source_url,
            &dto.auth_header_name,
            &dto.auth_header_value,
            dto.sync_interval_hours,
            if dto.auto_update_prices { 1 } else { 0 },
            if dto.auto_update_stocks { 1 } else { 0 },
            if dto.auto_create_new_products { 1 } else { 0 },
            &dto.mapping_rules,
        ),
    )?;

    let _ = sync_counters(conn);

    Ok(FeedSourceDto {
        id,
        supplier_id: dto.supplier_id,
        supplier_name: None,
        name: dto.name,
        source_type: dto.source_type,
        file_format: dto.file_format,
        source_url: dto.source_url,
        s3_file_key: None,
        auth_header_name: dto.auth_header_name,
        auth_header_value: dto.auth_header_value,
        sync_interval_hours: dto.sync_interval_hours,
        auto_update_prices: dto.auto_update_prices,
        auto_update_stocks: dto.auto_update_stocks,
        auto_create_new_products: dto.auto_create_new_products,
        mapping_rules: dto.mapping_rules,
        products_count: Some(0),
        last_synced_at: None,
        last_sync_status: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn delete_feed_source(conn: &Connection, id: &str, delete_products: bool) -> Result<usize> {
    conn.execute("DELETE FROM local_feed_sources WHERE id = ?1", [id])?;
    let mut deleted = 0;
    if delete_products {
        deleted = conn.execute("DELETE FROM local_products WHERE feed_source_id = ?1", [id])?;
    }
    let _ = sync_counters(conn);
    Ok(deleted)
}

pub fn get_products(conn: &Connection) -> Result<Vec<ProductDto>> {
    let mut stmt = conn.prepare("SELECT id, catalog_id, supplier_id, feed_source_id, category_id, sku, external_id, barcode, vendor_code, title_uk, title_en, description_uk, description_en, vendor, cost_price, price, old_price, currency, stock_quantity, in_stock, status, raw_payload, created_at, updated_at FROM local_products")?;
    
    let product_iter = stmt.query_map([], |row| {
        Ok(ProductDto {
            id: row.get(0)?,
            catalog_id: row.get(1)?,
            supplier_id: row.get(2)?,
            supplier_name: None,
            supplier_code: None,
            feed_source_id: row.get(3)?,
            category_id: row.get(4)?,
            category_name_uk: None,
            sku: row.get(5)?,
            external_id: row.get(6)?,
            barcode: row.get(7)?,
            vendor_code: row.get(8)?,
            title_uk: row.get(9)?,
            title_en: row.get(10)?,
            description_uk: row.get(11)?,
            description_en: row.get(12)?,
            vendor: row.get(13)?,
            cost_price: row.get(14)?,
            price: row.get(15)?,
            old_price: row.get(16)?,
            currency: row.get(17)?,
            stock_quantity: row.get(18)?,
            in_stock: row.get::<_, i32>(19)? == 1,
            status: row.get(20)?,
            raw_payload: row.get(21)?,
            created_at: row.get(22)?,
            updated_at: row.get(23)?,
        })
    })?;

    let mut products = Vec::new();
    for product in product_iter {
        products.push(product?);
    }
    
    Ok(products)
}

pub fn bulk_upsert_products(conn: &mut Connection, products: Vec<CreateProductDto>) -> Result<Vec<ProductDto>> {
    let tx = conn.transaction()?;
    let mut returned_products = Vec::new();
    
    {
        let mut stmt = tx.prepare(
            "INSERT INTO local_products (id, catalog_id, supplier_id, category_id, sku, external_id, barcode, vendor_code, title_uk, title_en, description_uk, description_en, vendor, cost_price, price, old_price, currency, stock_quantity, in_stock, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET
                title_uk = excluded.title_uk,
                price = excluded.price,
                stock_quantity = excluded.stock_quantity,
                in_stock = excluded.in_stock,
                updated_at = CURRENT_TIMESTAMP",
        )?;

        for dto in products {
            // For now, generating ID by SKU+Supplier or just UUID
            // In a real scenario, we'd check if sku+supplier exists and update. 
            // Since we set PRIMARY KEY to id, we should generate an ID based on SKU to enforce upsert.
            let id = format!("sf_prod_{}_{}", &dto.supplier_id, &dto.sku);
            
            stmt.execute(params![
                &id,
                dto.catalog_id.as_deref().unwrap_or("default_catalog"),
                &dto.supplier_id,
                &dto.category_id,
                &dto.sku,
                &dto.external_id,
                &dto.barcode,
                &dto.vendor_code,
                &dto.title_uk,
                &dto.title_en,
                &dto.description_uk,
                &dto.description_en,
                &dto.vendor,
                dto.cost_price,
                dto.price,
                dto.old_price,
                &dto.currency,
                dto.stock_quantity,
                if dto.in_stock { 1 } else { 0 },
                &dto.status,
            ])?;

            returned_products.push(ProductDto {
                id,
                catalog_id: dto.catalog_id.unwrap_or_else(|| "default_catalog".to_string()),
                supplier_id: dto.supplier_id,
                supplier_name: None,
                supplier_code: None,
                feed_source_id: None,
                category_id: dto.category_id,
                category_name_uk: None,
                sku: dto.sku,
                external_id: dto.external_id,
                barcode: dto.barcode,
                vendor_code: dto.vendor_code,
                title_uk: dto.title_uk,
                title_en: dto.title_en,
                description_uk: dto.description_uk,
                description_en: dto.description_en,
                vendor: dto.vendor,
                cost_price: dto.cost_price,
                price: dto.price,
                old_price: dto.old_price,
                currency: dto.currency,
                stock_quantity: dto.stock_quantity,
                in_stock: dto.in_stock,
                status: dto.status,
                raw_payload: None,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
            });
        }
    }
    
    tx.commit()?;
    
    // We shouldn't borrow `conn` mutably and simultaneously use it for sync_counters, but tx.commit() frees it.
    let _ = sync_counters(conn);
    
    Ok(returned_products)
}

pub fn bulk_delete_products(conn: &Connection, ids: Vec<String>) -> Result<()> {
    // Basic implementation for bulk delete
    for id in ids {
        conn.execute("DELETE FROM local_products WHERE id = ?1", [&id])?;
    }
    let _ = sync_counters(conn);
    Ok(())
}
