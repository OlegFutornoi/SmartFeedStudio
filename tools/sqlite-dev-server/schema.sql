-- SmartFeed Studio Local SQLite Schema (100% parity with src-tauri/src/db/schema.rs)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

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
    default_margin_percent REAL DEFAULT 0,
    default_fixed_markup REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    base_currency TEXT DEFAULT 'UAH',
    target_currency TEXT DEFAULT 'UAH',
    exchange_rate_mode TEXT DEFAULT 'MANUAL',
    exchange_rate REAL DEFAULT 1.0,
    currency_buffer_percent REAL DEFAULT 0,
    price_rounding TEXT DEFAULT 'NONE',
    custom_rounding_rules TEXT DEFAULT '[]',
    selected_bank_id TEXT,
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
    base_currency TEXT DEFAULT 'UAH',
    target_currency TEXT DEFAULT 'UAH',
    exchange_rate_mode TEXT DEFAULT 'MANUAL',
    exchange_rate REAL DEFAULT 1.0,
    currency_buffer_percent REAL DEFAULT 0,
    price_rounding TEXT DEFAULT 'NONE',
    custom_rounding_rules TEXT DEFAULT '[]',
    selected_bank_id TEXT,
    last_synced_at TEXT,
    last_sync_status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supplier_id) REFERENCES local_suppliers(id) ON DELETE CASCADE
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
    feed_source_id TEXT,
    feed_name TEXT,
    marketplace_mappings TEXT DEFAULT '{}',
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

CREATE TABLE IF NOT EXISTS local_product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    original_url TEXT NOT NULL,
    local_path TEXT,
    thumbnail_path TEXT,
    file_hash TEXT,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    order_num INTEGER DEFAULT 0,
    is_main INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    download_error TEXT,
    retry_count INTEGER DEFAULT 0,
    s3_key TEXT,
    cloud_url TEXT,
    sync_status TEXT DEFAULT 'LOCAL_ONLY',
    last_synced_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES local_products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS local_counters (
    id TEXT PRIMARY KEY,
    suppliers_count INTEGER DEFAULT 0,
    feeds_count INTEGER DEFAULT 0,
    products_count INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_bank_rates (
    id TEXT PRIMARY KEY,
    bank_id TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    badge TEXT NOT NULL,
    logo_url TEXT,
    currency TEXT NOT NULL,
    buy_rate REAL NOT NULL,
    sell_rate REAL NOT NULL,
    delta_nbu REAL DEFAULT 0.0,
    delta_percent REAL DEFAULT 0.0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS local_marketplace_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    marketplace_code TEXT NOT NULL DEFAULT 'ROZETKA',
    external_id TEXT NOT NULL,
    xml_attribute_name TEXT NOT NULL DEFAULT 'rz_id',
    name_uk TEXT NOT NULL,
    name_en TEXT,
    full_path_uk TEXT,
    parent_external_id TEXT,
    url TEXT,
    default_commission_percent REAL DEFAULT 0,
    default_fixed_fee REAL DEFAULT 0,
    extra_config TEXT,
    is_leaf INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, marketplace_code, external_id)
);

CREATE TABLE IF NOT EXISTS local_supplier_category_marketplace_maps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    supplier_category_rule_id TEXT NOT NULL,
    marketplace_code TEXT NOT NULL DEFAULT 'ROZETKA',
    marketplace_category_id TEXT,
    external_category_id TEXT NOT NULL,
    external_category_name TEXT NOT NULL,
    commission_percent REAL DEFAULT 0,
    fixed_fee REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, supplier_category_rule_id, marketplace_code)
);

CREATE TABLE IF NOT EXISTS local_export_channels (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    marketplace_code TEXT NOT NULL,
    feed_format TEXT NOT NULL,
    slug TEXT NOT NULL,
    export_url TEXT,
    commission_percent REAL DEFAULT 10,
    extra_fixed_cost REAL DEFAULT 0,
    apply_reverse_markup INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    pricing_rules_count INTEGER DEFAULT 0,
    total_products_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_export_channel_pricing_rules (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
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
    FOREIGN KEY(channel_id) REFERENCES local_export_channels(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON local_products(sku);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON local_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_catalog ON local_products(catalog_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON local_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_name ON local_products(category_name_uk);
CREATE INDEX IF NOT EXISTS idx_feeds_supplier ON local_feed_sources(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_supplier ON local_supplier_categories(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cat_supplier_feed ON local_supplier_categories(supplier_id, feed_source_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_rules_supplier ON local_supplier_pricing_rules(supplier_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON local_product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON local_product_images(status);
CREATE INDEX IF NOT EXISTS idx_images_hash ON local_product_images(file_hash);
CREATE INDEX IF NOT EXISTS idx_bank_rates_bank_curr ON local_bank_rates(bank_id, currency);
CREATE INDEX IF NOT EXISTS idx_sync_settings_supplier ON local_supplier_sync_settings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_supplier ON local_supplier_sync_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_feeds_url_fingerprint ON local_feed_sources(url_fingerprint);
CREATE INDEX IF NOT EXISTS idx_feeds_supplier_fingerprint ON local_feed_sources(supplier_id, url_fingerprint);
CREATE INDEX IF NOT EXISTS idx_feeds_supplier_base_curr ON local_feed_sources(supplier_id, base_currency);
