use std::fs;
use std::path::{Path, PathBuf};

pub fn ensure_images_directories(workspace_root: &Path) -> std::io::Result<()> {
    let images_root = workspace_root.join("images");
    fs::create_dir_all(images_root.join("staging"))?;
    fs::create_dir_all(images_root.join("originals"))?;
    fs::create_dir_all(images_root.join("thumbnails"))?;
    Ok(())
}

pub fn get_sharded_relative_path(category: &str, hash: &str, ext: &str) -> String {
    let clean_hash = hash.to_lowercase();
    let prefix1 = if clean_hash.len() >= 2 { &clean_hash[0..2] } else { "00" };
    let prefix2 = if clean_hash.len() >= 4 { &clean_hash[2..4] } else { "00" };
    format!("images/{}/{}/{}/{}.{}", category, prefix1, prefix2, clean_hash, ext)
}

pub fn delete_physical_file(workspace_root: &Path, relative_path: &str) -> bool {
    let full_path = workspace_root.join(relative_path);
    if full_path.exists() && full_path.is_file() {
        if let Ok(_) = fs::remove_file(&full_path) {
            // Optional: try clean empty parent dir
            if let Some(parent) = full_path.parent() {
                let _ = fs::remove_dir(parent); // only removes if empty
            }
            return true;
        }
    }
    false
}

pub fn get_images_storage_size(workspace_root: &Path) -> (u64, u32) {
    let images_dir = workspace_root.join("images");
    if !images_dir.exists() {
        return (0, 0);
    }

    let mut total_bytes: u64 = 0;
    let mut file_count: u32 = 0;

    fn walk_dir(path: &Path, bytes: &mut u64, count: &mut u32) {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    walk_dir(&p, bytes, count);
                } else if let Ok(meta) = entry.metadata() {
                    *bytes += meta.len();
                    *count += 1;
                }
            }
        }
    }

    walk_dir(&images_dir, &mut total_bytes, &mut file_count);
    (total_bytes, file_count)
}
