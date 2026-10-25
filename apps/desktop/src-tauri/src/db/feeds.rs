use rusqlite::{params, Connection, Result};
use crate::models::{FeedSourceDto, CreateFeedSourceDto, UpdateFeedSourceDto};
use super::sync_counters;

pub fn get_supplier_feed_sources(conn: &Connection, supplier_id: &str) -> Result<Vec<FeedSourceDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, supplier_id, name, source_type, file_format, source_url, 
                canonical_url, url_fingerprint, content_hash, parent_feed_source_id,
                s3_file_key, auth_header_name, auth_header_value, sync_interval_hours, 
                auto_update_prices, auto_update_stocks, auto_create_new_products, 
                mapping_rules, last_synced_at, last_sync_status, created_at, updated_at,
                base_currency, target_currency, exchange_rate_mode, exchange_rate,
                currency_buffer_percent, price_rounding, custom_rounding_rules, selected_bank_id
         FROM local_feed_sources WHERE supplier_id = ?1"
    )?;
    
    let feed_iter = stmt.query_map([supplier_id], |row| {
        let custom_rules_str: String = row.get(28).unwrap_or_else(|_| "[]".to_string());
        let custom_rounding_rules: Vec<serde_json::Value> = serde_json::from_str(&custom_rules_str).unwrap_or_default();
        Ok(FeedSourceDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            supplier_name: None,
            name: row.get(2)?,
            source_type: row.get(3)?,
            file_format: row.get(4)?,
            source_url: row.get(5)?,
            canonical_url: row.get(6)?,
            url_fingerprint: row.get(7)?,
            content_hash: row.get(8)?,
            parent_feed_source_id: row.get(9)?,
            s3_file_key: row.get(10)?,
            auth_header_name: row.get(11)?,
            auth_header_value: row.get(12)?,
            sync_interval_hours: row.get(13)?,
            auto_update_prices: row.get::<_, i32>(14)? == 1,
            auto_update_stocks: row.get::<_, i32>(15)? == 1,
            auto_create_new_products: row.get::<_, i32>(16)? == 1,
            mapping_rules: row.get(17)?,
            products_count: None,
            last_synced_at: row.get(18)?,
            last_sync_status: row.get(19)?,
            created_at: row.get(20)?,
            updated_at: row.get(21)?,
            base_currency: row.get(22)?,
            target_currency: row.get(23)?,
            exchange_rate_mode: row.get(24)?,
            exchange_rate: row.get(25)?,
            currency_buffer_percent: row.get(26)?,
            price_rounding: row.get(27)?,
            custom_rounding_rules,
            selected_bank_id: row.get(29)?,
        })
    })?;

    let mut feeds = Vec::new();
    for feed in feed_iter {
        feeds.push(feed?);
    }
    
    Ok(feeds)
}

pub fn get_all_feed_sources(conn: &Connection) -> Result<Vec<FeedSourceDto>> {
    let mut stmt = conn.prepare(
        "SELECT f.id, f.supplier_id, s.name, f.name, f.source_type, f.file_format, f.source_url, 
                f.canonical_url, f.url_fingerprint, f.content_hash, f.parent_feed_source_id,
                f.s3_file_key, f.auth_header_name, f.auth_header_value, f.sync_interval_hours, 
                f.auto_update_prices, f.auto_update_stocks, f.auto_create_new_products, 
                f.mapping_rules, f.last_synced_at, f.last_sync_status, f.created_at, f.updated_at,
                (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = f.id) as products_count,
                f.base_currency, f.target_currency, f.exchange_rate_mode, f.exchange_rate,
                f.currency_buffer_percent, f.price_rounding, f.custom_rounding_rules, f.selected_bank_id
         FROM local_feed_sources f
         LEFT JOIN local_suppliers s ON s.id = f.supplier_id
         ORDER BY f.created_at DESC"
    )?;

    let feed_iter = stmt.query_map([], |row| {
        let custom_rules_str: String = row.get(29).unwrap_or_else(|_| "[]".to_string());
        let custom_rounding_rules: Vec<serde_json::Value> = serde_json::from_str(&custom_rules_str).unwrap_or_default();
        Ok(FeedSourceDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            supplier_name: row.get(2)?,
            name: row.get(3)?,
            source_type: row.get(4)?,
            file_format: row.get(5)?,
            source_url: row.get(6)?,
            canonical_url: row.get(7)?,
            url_fingerprint: row.get(8)?,
            content_hash: row.get(9)?,
            parent_feed_source_id: row.get(10)?,
            s3_file_key: row.get(11)?,
            auth_header_name: row.get(12)?,
            auth_header_value: row.get(13)?,
            sync_interval_hours: row.get(14)?,
            auto_update_prices: row.get::<_, i32>(15)? == 1,
            auto_update_stocks: row.get::<_, i32>(16)? == 1,
            auto_create_new_products: row.get::<_, i32>(17)? == 1,
            mapping_rules: row.get(18)?,
            products_count: Some(row.get::<_, u32>(23).unwrap_or(0)),
            last_synced_at: row.get(19)?,
            last_sync_status: row.get(20)?,
            created_at: row.get(21)?,
            updated_at: row.get(22)?,
            base_currency: row.get(24)?,
            target_currency: row.get(25)?,
            exchange_rate_mode: row.get(26)?,
            exchange_rate: row.get(27)?,
            currency_buffer_percent: row.get(28)?,
            price_rounding: row.get(29)?,
            custom_rounding_rules,
            selected_bank_id: row.get(31)?,
        })
    })?;

    let mut feeds = Vec::new();
    for feed in feed_iter {
        feeds.push(feed?);
    }

    Ok(feeds)
}

pub fn get_feed_source_by_id(conn: &Connection, id: &str) -> Result<Option<FeedSourceDto>> {
    let mut stmt = conn.prepare(
        "SELECT f.id, f.supplier_id, s.name, f.name, f.source_type, f.file_format, f.source_url, 
                f.canonical_url, f.url_fingerprint, f.content_hash, f.parent_feed_source_id,
                f.s3_file_key, f.auth_header_name, f.auth_header_value, f.sync_interval_hours, 
                f.auto_update_prices, f.auto_update_stocks, f.auto_create_new_products, 
                f.mapping_rules, f.last_synced_at, f.last_sync_status, f.created_at, f.updated_at,
                (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = f.id) as products_count,
                f.base_currency, f.target_currency, f.exchange_rate_mode, f.exchange_rate,
                f.currency_buffer_percent, f.price_rounding, f.custom_rounding_rules, f.selected_bank_id
         FROM local_feed_sources f
         LEFT JOIN local_suppliers s ON s.id = f.supplier_id
         WHERE f.id = ?1"
    )?;

    let mut rows = stmt.query([id])?;
    if let Some(row) = rows.next()? {
        let custom_rules_str: String = row.get(30).unwrap_or_else(|_| "[]".to_string());
        let custom_rounding_rules: Vec<serde_json::Value> = serde_json::from_str(&custom_rules_str).unwrap_or_default();
        Ok(Some(FeedSourceDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            supplier_name: row.get(2)?,
            name: row.get(3)?,
            source_type: row.get(4)?,
            file_format: row.get(5)?,
            source_url: row.get(6)?,
            canonical_url: row.get(7)?,
            url_fingerprint: row.get(8)?,
            content_hash: row.get(9)?,
            parent_feed_source_id: row.get(10)?,
            s3_file_key: row.get(11)?,
            auth_header_name: row.get(12)?,
            auth_header_value: row.get(13)?,
            sync_interval_hours: row.get(14)?,
            auto_update_prices: row.get::<_, i32>(15)? == 1,
            auto_update_stocks: row.get::<_, i32>(16)? == 1,
            auto_create_new_products: row.get::<_, i32>(17)? == 1,
            mapping_rules: row.get(18)?,
            products_count: Some(row.get::<_, u32>(23).unwrap_or(0)),
            last_synced_at: row.get(19)?,
            last_sync_status: row.get(20)?,
            created_at: row.get(21)?,
            updated_at: row.get(22)?,
            base_currency: row.get(24)?,
            target_currency: row.get(25)?,
            exchange_rate_mode: row.get(26)?,
            exchange_rate: row.get(27)?,
            currency_buffer_percent: row.get(28)?,
            price_rounding: row.get(29)?,
            custom_rounding_rules,
            selected_bank_id: row.get(31)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_feed_source(conn: &Connection, dto: CreateFeedSourceDto) -> Result<FeedSourceDto> {
    let base_currency = dto.base_currency.unwrap_or_else(|| "UAH".to_string());
    let target_currency = dto.target_currency.unwrap_or_else(|| "UAH".to_string());
    let exchange_rate_mode = dto.exchange_rate_mode.unwrap_or_else(|| "MANUAL".to_string());
    let exchange_rate = dto.exchange_rate.unwrap_or(1.0);
    let currency_buffer_percent = dto.currency_buffer_percent.unwrap_or(0.0);
    let price_rounding = dto.price_rounding.unwrap_or_else(|| "NONE".to_string());
    let custom_rounding_rules = dto.custom_rounding_rules.unwrap_or_default();
    let custom_rounding_rules_json = serde_json::to_string(&custom_rounding_rules).unwrap_or_else(|_| "[]".to_string());
    let selected_bank_id = dto.selected_bank_id;

    // Check if feed already exists for this supplier by fingerprint or id
    let existing_feed_id: Option<String> = if let Some(ref req_id) = dto.id {
        conn.query_row(
            "SELECT id FROM local_feed_sources WHERE id = ?1",
            [req_id],
            |r| r.get(0),
        ).ok()
    } else if let Some(ref fp) = dto.url_fingerprint {
        if !fp.is_empty() {
            conn.query_row(
                "SELECT id FROM local_feed_sources WHERE supplier_id = ?1 AND url_fingerprint = ?2",
                params![&dto.supplier_id, fp],
                |r| r.get(0),
            ).ok()
        } else {
            None
        }
    } else {
        None
    };

    let id = if let Some(existing) = existing_feed_id {
        let auto_prices = if dto.auto_update_prices { 1 } else { 0 };
        let auto_stocks = if dto.auto_update_stocks { 1 } else { 0 };
        let auto_new = if dto.auto_create_new_products { 1 } else { 0 };

        conn.execute(
            "UPDATE local_feed_sources SET 
                name = ?1, source_type = ?2, file_format = ?3, source_url = ?4,
                canonical_url = ?5, url_fingerprint = ?6, content_hash = ?7, parent_feed_source_id = ?8,
                auth_header_name = ?9, auth_header_value = ?10, sync_interval_hours = ?11,
                auto_update_prices = ?12, auto_update_stocks = ?13, auto_create_new_products = ?14,
                mapping_rules = ?15, base_currency = ?16, target_currency = ?17,
                exchange_rate_mode = ?18, exchange_rate = ?19, currency_buffer_percent = ?20,
                price_rounding = ?21, custom_rounding_rules = ?22, selected_bank_id = ?23,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?24",
            params![
                &dto.name,
                &dto.source_type,
                &dto.file_format,
                &dto.source_url,
                &dto.canonical_url,
                &dto.url_fingerprint,
                &dto.content_hash,
                &dto.parent_feed_source_id,
                &dto.auth_header_name,
                &dto.auth_header_value,
                dto.sync_interval_hours,
                auto_prices,
                auto_stocks,
                auto_new,
                &dto.mapping_rules,
                &base_currency,
                &target_currency,
                &exchange_rate_mode,
                exchange_rate,
                currency_buffer_percent,
                &price_rounding,
                &custom_rounding_rules_json,
                &selected_bank_id,
                &existing,
            ],
        )?;
        existing
    } else {
        let new_id = dto.id.unwrap_or_else(|| format!("sf_feed_{}", uuid::Uuid::new_v4().to_string().replace("-", "")));
        let auto_prices = if dto.auto_update_prices { 1 } else { 0 };
        let auto_stocks = if dto.auto_update_stocks { 1 } else { 0 };
        let auto_new = if dto.auto_create_new_products { 1 } else { 0 };

        conn.execute(
            "INSERT INTO local_feed_sources (
                id, supplier_id, name, source_type, file_format, source_url, 
                canonical_url, url_fingerprint, content_hash, parent_feed_source_id,
                auth_header_name, auth_header_value, sync_interval_hours, 
                auto_update_prices, auto_update_stocks, auto_create_new_products, mapping_rules,
                base_currency, target_currency, exchange_rate_mode, exchange_rate,
                currency_buffer_percent, price_rounding, custom_rounding_rules, selected_bank_id
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25)",
            params![
                &new_id,
                &dto.supplier_id,
                &dto.name,
                &dto.source_type,
                &dto.file_format,
                &dto.source_url,
                &dto.canonical_url,
                &dto.url_fingerprint,
                &dto.content_hash,
                &dto.parent_feed_source_id,
                &dto.auth_header_name,
                &dto.auth_header_value,
                dto.sync_interval_hours,
                auto_prices,
                auto_stocks,
                auto_new,
                &dto.mapping_rules,
                &base_currency,
                &target_currency,
                &exchange_rate_mode,
                exchange_rate,
                currency_buffer_percent,
                &price_rounding,
                &custom_rounding_rules_json,
                &selected_bank_id,
            ],
        )?;
        new_id
    };

    let _ = sync_counters(conn);

    get_feed_source_by_id(conn, &id).map(|opt| opt.unwrap())
}

pub fn update_feed_source(conn: &Connection, id: &str, dto: UpdateFeedSourceDto) -> Result<FeedSourceDto> {
    let current = match get_feed_source_by_id(conn, id)? {
        Some(f) => f,
        None => return Err(rusqlite::Error::QueryReturnedNoRows),
    };

    let name = dto.name.unwrap_or(current.name);
    let source_url = dto.source_url.or(current.source_url);
    let canonical_url = dto.canonical_url.or(current.canonical_url);
    let url_fingerprint = dto.url_fingerprint.or(current.url_fingerprint);
    let content_hash = dto.content_hash.or(current.content_hash);
    let parent_feed_source_id = dto.parent_feed_source_id.or(current.parent_feed_source_id);
    let auth_header_name = dto.auth_header_name.or(current.auth_header_name);
    let auth_header_value = dto.auth_header_value.or(current.auth_header_value);
    let sync_interval_hours = dto.sync_interval_hours.unwrap_or(current.sync_interval_hours);
    let auto_update_prices = dto.auto_update_prices.unwrap_or(current.auto_update_prices);
    let auto_update_stocks = dto.auto_update_stocks.unwrap_or(current.auto_update_stocks);
    let auto_create_new_products = dto.auto_create_new_products.unwrap_or(current.auto_create_new_products);
    let mapping_rules = dto.mapping_rules.or(current.mapping_rules);
    let base_currency = dto.base_currency.unwrap_or(current.base_currency);
    let target_currency = dto.target_currency.unwrap_or(current.target_currency);
    let exchange_rate_mode = dto.exchange_rate_mode.unwrap_or(current.exchange_rate_mode);
    let exchange_rate = dto.exchange_rate.unwrap_or(current.exchange_rate);
    let currency_buffer_percent = dto.currency_buffer_percent.unwrap_or(current.currency_buffer_percent);
    let price_rounding = dto.price_rounding.unwrap_or(current.price_rounding);
    let custom_rounding_rules = dto.custom_rounding_rules.unwrap_or(current.custom_rounding_rules);
    let custom_rounding_rules_json = serde_json::to_string(&custom_rounding_rules).unwrap_or_else(|_| "[]".to_string());
    let selected_bank_id = dto.selected_bank_id.or(current.selected_bank_id);

    conn.execute(
        "UPDATE local_feed_sources SET
            name = ?1, source_url = ?2, canonical_url = ?3, url_fingerprint = ?4,
            content_hash = ?5, parent_feed_source_id = ?6, auth_header_name = ?7,
            auth_header_value = ?8, sync_interval_hours = ?9, auto_update_prices = ?10,
            auto_update_stocks = ?11, auto_create_new_products = ?12, mapping_rules = ?13,
            base_currency = ?14, target_currency = ?15, exchange_rate_mode = ?16,
            exchange_rate = ?17, currency_buffer_percent = ?18, price_rounding = ?19,
            custom_rounding_rules = ?20, selected_bank_id = ?21, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?22",
        params![
            &name, &source_url, &canonical_url, &url_fingerprint,
            &content_hash, &parent_feed_source_id, &auth_header_name,
            &auth_header_value, sync_interval_hours,
            if auto_update_prices { 1 } else { 0 },
            if auto_update_stocks { 1 } else { 0 },
            if auto_create_new_products { 1 } else { 0 },
            &mapping_rules, &base_currency, &target_currency, &exchange_rate_mode,
            exchange_rate, currency_buffer_percent, &price_rounding,
            &custom_rounding_rules_json, &selected_bank_id, id,
        ],
    )?;

    get_feed_source_by_id(conn, id).map(|opt| opt.unwrap())
}

pub fn delete_feed_source(conn: &Connection, id: &str, delete_products: bool) -> Result<usize> {
    let mut deleted = 0;
    if delete_products {
        let supplier_id_res: Result<String, _> = conn.query_row(
            "SELECT supplier_id FROM local_feed_sources WHERE id = ?1",
            [id],
            |row| row.get(0),
        );
        let supplier_id = supplier_id_res.ok();

        // 1. Delete all images of products attached to this feed_source_id
        let _ = conn.execute(
            "DELETE FROM local_product_images WHERE product_id IN (SELECT id FROM local_products WHERE feed_source_id = ?1)",
            [id],
        );
        deleted = conn.execute("DELETE FROM local_products WHERE feed_source_id = ?1", [id])?;

        // 2. Cascade cleanup for supplier products when no other feeds remain or orphaned products exist
        if let Some(sup_id) = &supplier_id {
            let other_feeds_count: i64 = conn.query_row(
                "SELECT COUNT(*) FROM local_feed_sources WHERE supplier_id = ?1 AND id != ?2",
                params![sup_id, id],
                |row| row.get(0),
            ).unwrap_or(0);

            if other_feeds_count == 0 {
                // All feeds for this supplier are deleted -> all products of this supplier MUST be removed
                let _ = conn.execute(
                    "DELETE FROM local_product_images WHERE product_id IN (SELECT id FROM local_products WHERE supplier_id = ?1)",
                    [sup_id],
                );
                let extra_deleted = conn.execute("DELETE FROM local_products WHERE supplier_id = ?1", [sup_id])?;
                deleted += extra_deleted;
                let _ = conn.execute(
                    "DELETE FROM local_supplier_categories WHERE supplier_id = ?1",
                    [sup_id],
                );
                let _ = conn.execute(
                    "DELETE FROM local_supplier_category_marketplace_maps WHERE supplier_category_rule_id NOT IN (SELECT id FROM local_supplier_categories)",
                    [],
                );
            } else {
                // Delete orphaned products of this supplier that don't belong to any remaining feed
                let _ = conn.execute(
                    "DELETE FROM local_product_images WHERE product_id IN (
                        SELECT id FROM local_products 
                        WHERE supplier_id = ?1 AND (feed_source_id IS NULL OR feed_source_id = '' OR feed_source_id NOT IN (SELECT id FROM local_feed_sources WHERE id != ?2))
                    )",
                    params![sup_id, id],
                );
                let extra_deleted = conn.execute(
                    "DELETE FROM local_products 
                     WHERE supplier_id = ?1 AND (feed_source_id IS NULL OR feed_source_id = '' OR feed_source_id NOT IN (SELECT id FROM local_feed_sources WHERE id != ?2))",
                    params![sup_id, id],
                )?;
                deleted += extra_deleted;
                let _ = conn.execute(
                    "DELETE FROM local_supplier_categories WHERE supplier_id = ?1 AND feed_source_id = ?2",
                    params![sup_id, id],
                );
                let _ = conn.execute(
                    "DELETE FROM local_supplier_category_marketplace_maps WHERE supplier_category_rule_id NOT IN (SELECT id FROM local_supplier_categories)",
                    [],
                );
            }
        }
    }
    conn.execute("DELETE FROM local_feed_sources WHERE id = ?1", [id])?;
    let _ = sync_counters(conn);
    Ok(deleted)
}
