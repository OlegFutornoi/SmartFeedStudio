use rusqlite::{params, Connection, Result};
use crate::models::{FeedSourceDto, CreateFeedSourceDto};
use super::sync_counters;

pub fn get_supplier_feed_sources(conn: &Connection, supplier_id: &str) -> Result<Vec<FeedSourceDto>> {
    let mut stmt = conn.prepare("SELECT id, supplier_id, name, source_type, file_format, source_url, s3_file_key, auth_header_name, auth_header_value, sync_interval_hours, auto_update_prices, auto_update_stocks, auto_create_new_products, mapping_rules, last_synced_at, last_sync_status, created_at, updated_at FROM local_feed_sources WHERE supplier_id = ?1")?;
    
    let feed_iter = stmt.query_map([supplier_id], |row| {
        Ok(FeedSourceDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            supplier_name: None,
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
            products_count: None,
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
    let id = dto.id.unwrap_or_else(|| format!("sf_feed_{}", uuid::Uuid::new_v4().to_string().replace("-", "")));
    
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
