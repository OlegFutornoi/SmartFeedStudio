pub mod db;
pub mod storage;
pub mod downloader;

use rusqlite::Connection;
use std::path::Path;
use crate::models::DeleteProductImageResultDto;

pub fn delete_image_with_cascade(
    conn: &Connection,
    workspace_root: &Path,
    image_id: &str,
) -> Result<DeleteProductImageResultDto, String> {
    let deleted_info = db::delete_product_image_record(conn, image_id)
        .map_err(|e| e.to_string())?;

    if let Some((product_id, local_path, thumbnail_path, file_hash, _was_main)) = deleted_info {
        let mut file_deleted = false;

        // Check if any other products share this hash
        if let Some(hash) = file_hash {
            let ref_count = db::count_references_by_hash(conn, &hash).unwrap_or(0);
            if ref_count == 0 {
                if let Some(orig) = &local_path {
                    let _ = storage::delete_physical_file(workspace_root, orig);
                    file_deleted = true;
                }
                if let Some(thumb) = &thumbnail_path {
                    let _ = storage::delete_physical_file(workspace_root, thumb);
                }
            }
        } else if let Some(orig) = &local_path {
            let _ = storage::delete_physical_file(workspace_root, orig);
            file_deleted = true;
        }

        let remaining: u32 = conn.query_row(
            "SELECT COUNT(*) FROM local_product_images WHERE product_id = ?1",
            [&product_id],
            |r| r.get(0),
        ).unwrap_or(0);

        let new_main_id: Option<String> = conn.query_row(
            "SELECT id FROM local_product_images WHERE product_id = ?1 AND is_main = 1 LIMIT 1",
            [&product_id],
            |r| r.get(0),
        ).ok();

        return Ok(DeleteProductImageResultDto {
            success: true,
            image_id: image_id.to_string(),
            file_deleted,
            remaining_count: remaining,
            new_main_image_id: new_main_id,
        });
    }

    Ok(DeleteProductImageResultDto {
        success: false,
        image_id: image_id.to_string(),
        file_deleted: false,
        remaining_count: 0,
        new_main_image_id: None,
    })
}
