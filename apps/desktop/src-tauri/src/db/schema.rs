use rusqlite::{Connection, Result};

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
            legal_name TEXT,
            tax_id TEXT,
            industry TEXT,
            segment TEXT,
            manager_name TEXT,
            manager_position TEXT,
            manager_phone TEXT,
            manager_email TEXT,
            manager_telegram TEXT,
            country TEXT,
            city TEXT,
            address TEXT,
            postcode TEXT,
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
            canonical_url TEXT,
            url_fingerprint TEXT,
            content_hash TEXT,
            parent_feed_source_id TEXT,
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

        CREATE TABLE IF NOT EXISTS local_supplier_sync_settings (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL UNIQUE,
            protect_edited_products INTEGER DEFAULT 1,
            sync_prices INTEGER DEFAULT 1,
            sync_stocks INTEGER DEFAULT 1,
            image_sync_mode TEXT DEFAULT 'DO_NOT_UPDATE',
            description_sync_mode TEXT DEFAULT 'DO_NOT_UPDATE',
            attributes_sync_mode TEXT DEFAULT 'ADD_NEW_ONLY',
            title_sync_mode TEXT DEFAULT 'DO_NOT_UPDATE',
            category_sync_mode TEXT DEFAULT 'KEEP_MANUAL_MAPPING',
            barcode_sync_mode TEXT DEFAULT 'FILL_EMPTY_ONLY',
            price_source TEXT DEFAULT 'WHOLESALE',
            zero_price_action TEXT DEFAULT 'OUT_OF_STOCK',
            missing_products_action TEXT DEFAULT 'OUT_OF_STOCK',
            new_products_action TEXT DEFAULT 'AUTO_PUBLISH',
            sync_interval_hours INTEGER DEFAULT 0,
            last_synced_at TEXT,
            last_sync_status TEXT DEFAULT 'IDLE',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS local_supplier_sync_logs (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            feed_source_id TEXT,
            trigger TEXT DEFAULT 'MANUAL',
            status TEXT DEFAULT 'RUNNING',
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT,
            duration_ms INTEGER,
            total_products INTEGER DEFAULT 0,
            created_count INTEGER DEFAULT 0,
            updated_count INTEGER DEFAULT 0,
            out_of_stock_count INTEGER DEFAULT 0,
            errors_count INTEGER DEFAULT 0,
            error_message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_sync_settings_supplier ON local_supplier_sync_settings(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_supplier ON local_supplier_sync_logs(supplier_id);
        "#,
    )?;

    let _ = conn.execute_batch("
        ALTER TABLE local_suppliers ADD COLUMN logo_url TEXT;
        ALTER TABLE local_suppliers ADD COLUMN base_currency TEXT DEFAULT 'UAH';
        ALTER TABLE local_suppliers ADD COLUMN target_currency TEXT DEFAULT 'UAH';
        ALTER TABLE local_suppliers ADD COLUMN exchange_rate_mode TEXT DEFAULT 'MANUAL';
        ALTER TABLE local_suppliers ADD COLUMN exchange_rate REAL DEFAULT 1.0;
        ALTER TABLE local_suppliers ADD COLUMN currency_buffer_percent REAL DEFAULT 0;
        ALTER TABLE local_suppliers ADD COLUMN price_rounding TEXT DEFAULT 'NONE';
        ALTER TABLE local_suppliers ADD COLUMN legal_name TEXT;
        ALTER TABLE local_suppliers ADD COLUMN tax_id TEXT;
        ALTER TABLE local_suppliers ADD COLUMN industry TEXT;
        ALTER TABLE local_suppliers ADD COLUMN segment TEXT;
        ALTER TABLE local_suppliers ADD COLUMN manager_name TEXT;
        ALTER TABLE local_suppliers ADD COLUMN manager_position TEXT;
        ALTER TABLE local_suppliers ADD COLUMN manager_phone TEXT;
        ALTER TABLE local_suppliers ADD COLUMN manager_email TEXT;
        ALTER TABLE local_suppliers ADD COLUMN manager_telegram TEXT;
        ALTER TABLE local_suppliers ADD COLUMN country TEXT;
        ALTER TABLE local_suppliers ADD COLUMN city TEXT;
        ALTER TABLE local_suppliers ADD COLUMN address TEXT;
        ALTER TABLE local_suppliers ADD COLUMN postcode TEXT;
        ALTER TABLE local_products ADD COLUMN category_name_uk TEXT;
        ALTER TABLE local_feed_sources ADD COLUMN canonical_url TEXT;
        ALTER TABLE local_feed_sources ADD COLUMN url_fingerprint TEXT;
        ALTER TABLE local_feed_sources ADD COLUMN content_hash TEXT;
        ALTER TABLE local_feed_sources ADD COLUMN parent_feed_source_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_feeds_url_fingerprint ON local_feed_sources(url_fingerprint);
        CREATE INDEX IF NOT EXISTS idx_feeds_supplier_fingerprint ON local_feed_sources(supplier_id, url_fingerprint);
    ");

    let _ = conn.execute_batch("
        UPDATE local_products 
        SET supplier_id = (SELECT id FROM local_suppliers LIMIT 1)
        WHERE (supplier_id IS NULL OR supplier_id = '' OR supplier_id NOT IN (SELECT id FROM local_suppliers))
          AND (SELECT COUNT(*) FROM local_suppliers) = 1;
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
