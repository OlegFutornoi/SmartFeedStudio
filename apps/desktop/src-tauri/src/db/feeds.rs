use rusqlite::{params, Connection, Result};
use crate::models::{FeedSourceDto, CreateFeedSourceDto, CheckFeedCollisionDto, FeedCollisionResultDto};
use super::sync_counters;

pub fn get_supplier_feed_sources(conn: &Connection, supplier_id: &str) -> Result<Vec<FeedSourceDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, supplier_id, name, source_type, file_format, source_url, 
                canonical_url, url_fingerprint, content_hash, parent_feed_source_id,
                s3_file_key, auth_header_name, auth_header_value, sync_interval_hours, 
                auto_update_prices, auto_update_stocks, auto_create_new_products, 
                mapping_rules, last_synced_at, last_sync_status, created_at, updated_at 
         FROM local_feed_sources WHERE supplier_id = ?1"
    )?;
    
    let feed_iter = stmt.query_map([supplier_id], |row| {
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
                (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = f.id) as products_count
         FROM local_feed_sources f
         LEFT JOIN local_suppliers s ON s.id = f.supplier_id
         ORDER BY f.created_at DESC"
    )?;

    let feed_iter = stmt.query_map([], |row| {
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
        })
    })?;

    let mut feeds = Vec::new();
    for feed in feed_iter {
        feeds.push(feed?);
    }

    Ok(feeds)
}

pub fn check_feed_collision(conn: &Connection, dto: CheckFeedCollisionDto) -> Result<FeedCollisionResultDto> {
    let candidate_name = dto.feed_name.clone().unwrap_or_else(|| "Фід товарів".to_string());
    let fp = dto.url_fingerprint.clone().unwrap_or_default();
    let canonical = dto.canonical_url.clone().unwrap_or_default();
    let raw_source_url = dto.source_url.clone().unwrap_or_default();
    let content_hash = dto.content_hash.clone().unwrap_or_default();
    let file_name = dto.file_name.clone().unwrap_or_default();
    let base_url = if let Some(idx) = raw_source_url.find('?') {
        raw_source_url[..idx].to_string()
    } else {
        raw_source_url.clone()
    };

    // 1. Check for exact same-supplier duplicate by url_fingerprint, canonical, source_url, base_url, content_hash or file_name
    let has_match_criteria = !fp.is_empty() || !raw_source_url.is_empty() || !content_hash.is_empty() || !file_name.is_empty();
    if has_match_criteria {
        let mut stmt = conn.prepare(
            "SELECT id, name, last_synced_at, 
                    (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = local_feed_sources.id) 
             FROM local_feed_sources 
             WHERE supplier_id = ?1 AND (
                 (?2 != '' AND url_fingerprint = ?2) OR
                 (?3 != '' AND canonical_url = ?3) OR
                 (?4 != '' AND url = ?4) OR
                 (?5 != '' AND url LIKE ?5 || '%') OR
                 (?4 != '' AND ?4 LIKE url || '%') OR
                 (?6 != '' AND content_hash = ?6) OR
                 (?7 != '' AND LOWER(TRIM(name)) = LOWER(TRIM(?7)))
             ) LIMIT 1"
        )?;
        let row_res = stmt.query_row(params![&dto.supplier_id, &fp, &canonical, &raw_source_url, &base_url, &content_hash, &file_name], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, Option<String>>(2)?,
                r.get::<_, u32>(3).unwrap_or(0),
            ))
        });

        if let Ok((existing_id, existing_name, last_synced, p_count)) = row_res {
            return Ok(FeedCollisionResultDto {
                has_collision: true,
                collision_type: "SAME_SUPPLIER_DUPLICATE".to_string(),
                canonical_url: dto.canonical_url,
                url_fingerprint: dto.url_fingerprint,
                existing_feed_id: Some(existing_id),
                existing_feed_name: Some(existing_name.clone()),
                conflicting_supplier_id: Some(dto.supplier_id.clone()),
                conflicting_supplier_name: None,
                existing_products_count: Some(p_count),
                last_synced_at: last_synced,
                suggested_feed_name: existing_name.clone(),
                message_uk: format!("Цей фід уже підключений до цього постачальника під назвою «{}». Бажаєте оновити існуючий фід замість створення дубліката?", existing_name),
                message_en: format!("This feed is already connected to this supplier as «{}». Would you like to resync the existing feed instead of creating a duplicate?", existing_name),
            });
        }
    }

    // 2. Check for cross-supplier conflict (same url / base_url / content_hash on a DIFFERENT supplier)
    if !fp.is_empty() || !raw_source_url.is_empty() || !content_hash.is_empty() {
        let mut stmt = conn.prepare(
            "SELECT f.id, f.name, f.supplier_id, s.name, f.last_synced_at,
                    (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = f.id)
             FROM local_feed_sources f
             LEFT JOIN local_suppliers s ON s.id = f.supplier_id
             WHERE f.supplier_id != ?1 AND (
                 (?2 != '' AND f.url_fingerprint = ?2) OR
                 (?3 != '' AND f.canonical_url = ?3) OR
                 (?4 != '' AND f.url = ?4) OR
                 (?5 != '' AND f.url LIKE ?5 || '%') OR
                 (?4 != '' AND ?4 LIKE f.url || '%') OR
                 (?6 != '' AND f.content_hash = ?6)
             ) LIMIT 1"
        )?;
        let row_res = stmt.query_row(params![&dto.supplier_id, &fp, &canonical, &raw_source_url, &base_url, &content_hash], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, Option<String>>(4)?,
                r.get::<_, u32>(5).unwrap_or(0),
            ))
        });

        if let Ok((existing_id, existing_name, other_sup_id, other_sup_name, last_synced, p_count)) = row_res {
            let sup_label = other_sup_name.unwrap_or_else(|| "інший постачальник".to_string());
            let is_disambiguated = candidate_name.to_lowercase() != existing_name.to_lowercase() &&
                (candidate_name.to_lowercase().contains(&sup_label.to_lowercase()) || candidate_name.contains(" ["));

            if !is_disambiguated {
                let suggested = format!("{} [{}]", existing_name, sup_label);
                return Ok(FeedCollisionResultDto {
                    has_collision: true,
                    collision_type: "CROSS_SUPPLIER_CONFLICT".to_string(),
                    canonical_url: dto.canonical_url,
                    url_fingerprint: dto.url_fingerprint,
                    existing_feed_id: Some(existing_id),
                    existing_feed_name: Some(existing_name),
                    conflicting_supplier_id: Some(other_sup_id),
                    conflicting_supplier_name: Some(sup_label.clone()),
                    existing_products_count: Some(p_count),
                    last_synced_at: last_synced,
                    suggested_feed_name: suggested,
                    message_uk: format!("Цей фід вже зареєстрований за постачальником «{}». Оберіть унікальну назву для ізольованого імпорту.", sup_label),
                    message_en: format!("This feed is already used by supplier «{}». Choose a unique name for isolated import.", sup_label),
                });
            }
        }
    }

    // 3. Check for feed name collision within the same supplier
    if !candidate_name.is_empty() {
        let name_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM local_feed_sources WHERE supplier_id = ?1 AND LOWER(TRIM(name)) = LOWER(TRIM(?2))",
            params![&dto.supplier_id, &candidate_name],
            |r| r.get(0),
        ).unwrap_or(0);

        if name_count > 0 {
            let suggested = format!("{} #{}", candidate_name, name_count + 1);
            return Ok(FeedCollisionResultDto {
                has_collision: true,
                collision_type: "NAME_COLLISION".to_string(),
                canonical_url: dto.canonical_url,
                url_fingerprint: dto.url_fingerprint,
                existing_feed_id: None,
                existing_feed_name: Some(candidate_name.clone()),
                conflicting_supplier_id: Some(dto.supplier_id.clone()),
                conflicting_supplier_name: None,
                existing_products_count: None,
                last_synced_at: None,
                suggested_feed_name: suggested,
                message_uk: format!("Фід із назвою «{}» вже існує для цього постачальника. Назву автоматично змінено для унікальності.", candidate_name),
                message_en: format!("A feed named «{}» already exists for this supplier. Name has been adjusted for uniqueness.", candidate_name),
            });
        }
    }

    // No collision detected
    Ok(FeedCollisionResultDto {
        has_collision: false,
        collision_type: "NONE".to_string(),
        canonical_url: dto.canonical_url,
        url_fingerprint: dto.url_fingerprint,
        existing_feed_id: None,
        existing_feed_name: None,
        conflicting_supplier_id: None,
        conflicting_supplier_name: None,
        existing_products_count: None,
        last_synced_at: None,
        suggested_feed_name: candidate_name,
        message_uk: "Фід унікальний. Колізій не виявлено.".to_string(),
        message_en: "Feed is unique. No collisions detected.".to_string(),
    })
}

pub fn create_feed_source(conn: &Connection, dto: CreateFeedSourceDto) -> Result<FeedSourceDto> {
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
        // Update existing feed record instead of inserting a duplicate!
        let auto_prices = if dto.auto_update_prices { 1 } else { 0 };
        let auto_stocks = if dto.auto_update_stocks { 1 } else { 0 };
        let auto_new = if dto.auto_create_new_products { 1 } else { 0 };

        conn.execute(
            "UPDATE local_feed_sources SET 
                name = ?1, source_type = ?2, file_format = ?3, source_url = ?4,
                canonical_url = ?5, url_fingerprint = ?6, content_hash = ?7, parent_feed_source_id = ?8,
                auth_header_name = ?9, auth_header_value = ?10, sync_interval_hours = ?11,
                auto_update_prices = ?12, auto_update_stocks = ?13, auto_create_new_products = ?14,
                mapping_rules = ?15, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?16",
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
                auto_update_prices, auto_update_stocks, auto_create_new_products, mapping_rules
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
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
            ],
        )?;
        new_id
    };

    let _ = sync_counters(conn);

    Ok(FeedSourceDto {
        id,
        supplier_id: dto.supplier_id,
        supplier_name: None,
        name: dto.name,
        source_type: dto.source_type,
        file_format: dto.file_format,
        source_url: dto.source_url,
        canonical_url: dto.canonical_url,
        url_fingerprint: dto.url_fingerprint,
        content_hash: dto.content_hash,
        parent_feed_source_id: dto.parent_feed_source_id,
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
            }
        }
    }
    conn.execute("DELETE FROM local_feed_sources WHERE id = ?1", [id])?;
    let _ = sync_counters(conn);
    Ok(deleted)
}
