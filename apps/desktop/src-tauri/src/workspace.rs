use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceInfo {
    pub workspace_path: String,
    pub is_initialized: bool,
    pub database_path: String,
    pub is_encrypted: bool,
    pub encryption_algorithm: String,
    pub created_at: Option<String>,
    pub last_backup_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
    pub database_size_bytes: u64,
    pub feeds_size_bytes: u64,
    pub exports_size_bytes: u64,
    pub backups_size_bytes: u64,
    pub logs_size_bytes: u64,
    pub total_size_bytes: u64,
    pub available_disk_space_bytes: Option<u64>,
    pub products_count: u64,
    pub suppliers_count: u64,
    pub feeds_count: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseMaintenanceResult {
    pub success: bool,
    pub integrity_ok: bool,
    pub bytes_freed: u64,
    pub message: String,
    pub timestamp: String,
}

pub fn get_default_workspace_dir() -> PathBuf {
    if let Ok(home) = std::env::var("HOME") {
        let docs = PathBuf::from(&home).join("Documents");
        if docs.exists() {
            docs.join("SmartFeedStudioData")
        } else {
            PathBuf::from(home).join("SmartFeedStudioData")
        }
    } else if let Ok(user_profile) = std::env::var("USERPROFILE") {
        let docs = PathBuf::from(&user_profile).join("Documents");
        if docs.exists() {
            docs.join("SmartFeedStudioData")
        } else {
            PathBuf::from(user_profile).join("SmartFeedStudioData")
        }
    } else {
        PathBuf::from("./SmartFeedStudioData")
    }
}

pub fn resolve_path(path_str: &str) -> PathBuf {
    let trimmed = path_str.trim();
    if trimmed.starts_with("~/") || trimmed == "~" {
        if let Ok(home) = std::env::var("HOME") {
            let rel = trimmed.trim_start_matches("~/").trim_start_matches('~');
            if rel.is_empty() {
                return PathBuf::from(home);
            }
            return PathBuf::from(home).join(rel);
        }
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            let rel = trimmed.trim_start_matches("~/").trim_start_matches('~');
            if rel.is_empty() {
                return PathBuf::from(user_profile);
            }
            return PathBuf::from(user_profile).join(rel);
        }
    }
    PathBuf::from(trimmed)
}

pub fn dir_size(path: &Path) -> u64 {
    if !path.exists() {
        return 0;
    }
    if path.is_file() {
        return fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    }
    let mut total: u64 = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                total += dir_size(&p);
            } else if let Ok(m) = entry.metadata() {
                total += m.len();
            }
        }
    }
    total
}

pub fn init_workspace_structure(base_path: &str) -> Result<WorkspaceInfo, String> {
    let root = resolve_path(base_path);
    let resolved_path_str = root.to_string_lossy().to_string();
    
    // Create folder structure
    let dirs = ["database", "feeds", "exports", "backups", "logs"];
    for dir in &dirs {
        let dir_path = root.join(dir);
        fs::create_dir_all(&dir_path).map_err(|e| format!("Failed to create folder {:?}: {}", dir_path, e))?;
    }

    let db_path = root.join("database").join("catalog.db");
    if !db_path.exists() {
        fs::File::create(&db_path).map_err(|e| format!("Failed to create database file: {}", e))?;
    }

    let config_path = root.join("workspace.json");
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string();

    let info = WorkspaceInfo {
        workspace_path: resolved_path_str,
        is_initialized: true,
        database_path: db_path.to_string_lossy().to_string(),
        is_encrypted: true,
        encryption_algorithm: "SQLCipher-AES256".to_string(),
        created_at: Some(now),
        last_backup_at: None,
    };

    let json_str = serde_json::to_string_pretty(&info).map_err(|e| e.to_string())?;
    fs::write(&config_path, json_str).map_err(|e| format!("Failed to write workspace.json: {}", e))?;

    Ok(info)
}

pub fn read_storage_stats(base_path: &str) -> Result<StorageStats, String> {
    let root = resolve_path(base_path);
    if !root.exists() {
        return Err(format!("Workspace path {:?} does not exist", base_path));
    }

    let db_size = dir_size(&root.join("database"));
    let feeds_size = dir_size(&root.join("feeds"));
    let exports_size = dir_size(&root.join("exports"));
    let backups_size = dir_size(&root.join("backups"));
    let logs_size = dir_size(&root.join("logs"));
    let total_size = db_size + feeds_size + exports_size + backups_size + logs_size;

    Ok(StorageStats {
        database_size_bytes: db_size,
        feeds_size_bytes: feeds_size,
        exports_size_bytes: exports_size,
        backups_size_bytes: backups_size,
        logs_size_bytes: logs_size,
        total_size_bytes: total_size,
        available_disk_space_bytes: Some(100 * 1024 * 1024 * 1024), // 100GB placeholder
        products_count: 0,
        suppliers_count: 0,
        feeds_count: 0,
    })
}

pub fn create_backup_file(base_path: &str) -> Result<String, String> {
    let root = resolve_path(base_path);
    let db_file = root.join("database").join("catalog.db");
    if !db_file.exists() {
        return Err("Database file does not exist yet".to_string());
    }

    let backups_dir = root.join("backups");
    fs::create_dir_all(&backups_dir).map_err(|e| e.to_string())?;

    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let backup_filename = format!("backup_catalog_{}.sfdb", timestamp);
    let target_file = backups_dir.join(&backup_filename);

    fs::copy(&db_file, &target_file).map_err(|e| format!("Failed to copy backup file: {}", e))?;

    Ok(target_file.to_string_lossy().to_string())
}
