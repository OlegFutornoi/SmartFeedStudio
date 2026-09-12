use crate::models::{CreateProductImageDto, LocalProductImageDto, UpdateProductImageOrderDto};
use rusqlite::{params, Connection, Result};
use std::collections::HashMap;

pub fn init_images_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
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

        CREATE INDEX IF NOT EXISTS idx_images_product ON local_product_images(product_id);
        CREATE INDEX IF NOT EXISTS idx_images_status ON local_product_images(status);
        CREATE INDEX IF NOT EXISTS idx_images_hash ON local_product_images(file_hash);
        CREATE INDEX IF NOT EXISTS idx_images_sync_status ON local_product_images(sync_status);
        "#,
    )?;
    Ok(())
}

pub fn get_images_by_product_id(conn: &Connection, product_id: &str) -> Result<Vec<LocalProductImageDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, product_id, original_url, local_path, thumbnail_path, file_hash, file_size, \
         mime_type, width, height, order_num, is_main, status, download_error, retry_count, \
         s3_key, cloud_url, sync_status, last_synced_at, created_at, updated_at \
         FROM local_product_images \
         WHERE product_id = ?1 \
         ORDER BY is_main DESC, order_num ASC, created_at ASC"
    )?;

    let rows = stmt.query_map([product_id], |row| {
        Ok(LocalProductImageDto {
            id: row.get(0)?,
            product_id: row.get(1)?,
            original_url: row.get(2)?,
            local_path: row.get(3)?,
            thumbnail_path: row.get(4)?,
            file_hash: row.get(5)?,
            file_size: row.get::<_, i64>(6)? as u64,
            mime_type: row.get(7)?,
            width: row.get(8)?,
            height: row.get(9)?,
            order: row.get(10)?,
            is_main: row.get::<_, i32>(11)? == 1,
            status: row.get(12)?,
            download_error: row.get(13)?,
            retry_count: row.get(14)?,
            s3_key: row.get(15)?,
            cloud_url: row.get(16)?,
            sync_status: row.get(17)?,
            last_synced_at: row.get(18)?,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
        })
    })?;

    let mut images = Vec::new();
    for img in rows {
        images.push(img?);
    }
    Ok(images)
}

pub fn get_images_for_products(
    conn: &Connection,
    product_ids: &[String],
) -> Result<HashMap<String, Vec<LocalProductImageDto>>> {
    let mut map = HashMap::new();
    if product_ids.is_empty() {
        return Ok(map);
    }

    // Initialize map
    for id in product_ids {
        map.insert(id.clone(), Vec::new());
    }

    let placeholders = product_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let query = format!(
        "SELECT id, product_id, original_url, local_path, thumbnail_path, file_hash, file_size, \
         mime_type, width, height, order_num, is_main, status, download_error, retry_count, \
         s3_key, cloud_url, sync_status, last_synced_at, created_at, updated_at \
         FROM local_product_images \
         WHERE product_id IN ({}) \
         ORDER BY product_id, is_main DESC, order_num ASC",
        placeholders
    );

    let mut stmt = conn.prepare(&query)?;

    let mut rows = stmt.query(rusqlite::params_from_iter(product_ids.iter()))?;
    while let Some(row) = rows.next()? {
        let product_id: String = row.get(1)?;
        let img = LocalProductImageDto {
            id: row.get(0)?,
            product_id: product_id.clone(),
            original_url: row.get(2)?,
            local_path: row.get(3)?,
            thumbnail_path: row.get(4)?,
            file_hash: row.get(5)?,
            file_size: row.get::<_, i64>(6)? as u64,
            mime_type: row.get(7)?,
            width: row.get(8)?,
            height: row.get(9)?,
            order: row.get(10)?,
            is_main: row.get::<_, i32>(11)? == 1,
            status: row.get(12)?,
            download_error: row.get(13)?,
            retry_count: row.get(14)?,
            s3_key: row.get(15)?,
            cloud_url: row.get(16)?,
            sync_status: row.get(17)?,
            last_synced_at: row.get(18)?,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
        };
        if let Some(list) = map.get_mut(&product_id) {
            list.push(img);
        }
    }
    Ok(map)
}

pub fn insert_product_image(conn: &Connection, dto: &CreateProductImageDto, product_id: &str) -> Result<LocalProductImageDto> {
    let id = format!("sf_img_{}", uuid::Uuid::new_v4());
    conn.execute(
        "INSERT INTO local_product_images (id, product_id, original_url, order_num, is_main, status, sync_status, created_at, updated_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, 'PENDING', 'LOCAL_ONLY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        params![
            &id,
            product_id,
            &dto.original_url,
            dto.order,
            if dto.is_main { 1 } else { 0 },
        ],
    )?;

    Ok(LocalProductImageDto {
        id,
        product_id: product_id.to_string(),
        original_url: dto.original_url.clone(),
        local_path: None,
        thumbnail_path: None,
        file_hash: None,
        file_size: 0,
        mime_type: None,
        width: None,
        height: None,
        order: dto.order,
        is_main: dto.is_main,
        status: "PENDING".to_string(),
        download_error: None,
        retry_count: 0,
        s3_key: None,
        cloud_url: None,
        sync_status: "LOCAL_ONLY".to_string(),
        last_synced_at: None,
        created_at: Some(chrono::Utc::now().to_rfc3339()),
        updated_at: Some(chrono::Utc::now().to_rfc3339()),
    })
}

pub fn delete_product_image_record(
    conn: &Connection,
    image_id: &str,
) -> Result<Option<(String, Option<String>, Option<String>, Option<String>, bool)>> {
    // 1. Fetch info before delete
    let mut stmt = conn.prepare(
        "SELECT product_id, local_path, thumbnail_path, file_hash, is_main FROM local_product_images WHERE id = ?1"
    )?;
    
    let image_info = stmt.query_row([image_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, Option<String>>(1)?,
            row.get::<_, Option<String>>(2)?,
            row.get::<_, Option<String>>(3)?,
            row.get::<_, i32>(4)? == 1,
        ))
    }).ok();

    if let Some((product_id, local_path, thumbnail_path, file_hash, was_main)) = image_info {
        // 2. Delete row
        conn.execute("DELETE FROM local_product_images WHERE id = ?1", [image_id])?;

        // 3. If was main, assign new main
        if was_main {
            let next_main_id: Option<String> = conn.query_row(
                "SELECT id FROM local_product_images WHERE product_id = ?1 ORDER BY order_num ASC, created_at ASC LIMIT 1",
                [&product_id],
                |r| r.get(0),
            ).ok();

            if let Some(new_id) = next_main_id {
                let _ = conn.execute(
                    "UPDATE local_product_images SET is_main = 1 WHERE id = ?1",
                    [&new_id],
                );
            }
        }

        return Ok(Some((product_id, local_path, thumbnail_path, file_hash, was_main)));
    }

    Ok(None)
}

pub fn count_references_by_hash(conn: &Connection, file_hash: &str) -> Result<u32> {
    let count: u32 = conn.query_row(
        "SELECT COUNT(*) FROM local_product_images WHERE file_hash = ?1",
        [file_hash],
        |row| row.get(0),
    ).unwrap_or(0);
    Ok(count)
}

pub fn update_images_order(conn: &Connection, dto: &UpdateProductImageOrderDto) -> Result<()> {
    for (idx, id) in dto.image_ids_in_order.iter().enumerate() {
        let is_main = match &dto.main_image_id {
            Some(main_id) => if main_id == id { 1 } else { 0 },
            None => if idx == 0 { 1 } else { 0 },
        };
        conn.execute(
            "UPDATE local_product_images SET order_num = ?1, is_main = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3 AND product_id = ?4",
            params![idx as i32, is_main, id, &dto.product_id],
        )?;
    }
    Ok(())
}

pub fn update_image_download_result(
    conn: &Connection,
    image_id: &str,
    status: &str,
    local_path: Option<&str>,
    thumbnail_path: Option<&str>,
    file_hash: Option<&str>,
    file_size: u64,
    error: Option<&str>,
) -> Result<()> {
    conn.execute(
        "UPDATE local_product_images SET \
            status = ?1, \
            local_path = COALESCE(?2, local_path), \
            thumbnail_path = COALESCE(?3, thumbnail_path), \
            file_hash = COALESCE(?4, file_hash), \
            file_size = CASE WHEN ?5 > 0 THEN ?5 ELSE file_size END, \
            download_error = ?6, \
            retry_count = retry_count + (CASE WHEN ?1 = 'FAILED' THEN 1 ELSE 0 END), \
            updated_at = CURRENT_TIMESTAMP \
         WHERE id = ?7",
        params![
            status,
            local_path,
            thumbnail_path,
            file_hash,
            file_size as i64,
            error,
            image_id,
        ],
    )?;
    Ok(())
}
