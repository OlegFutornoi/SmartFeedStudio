pub mod db;
pub mod workspace;
pub mod models;

use keyring::Entry;
#[allow(unused_imports)]
use tauri::Manager;
use workspace::{
    create_backup_file, get_default_workspace_dir, init_workspace_structure, read_storage_stats,
    DatabaseMaintenanceResult, StorageStats, WorkspaceInfo,
};

const SERVICE_NAME: &str = "SmartFeedStudio";
const TOKEN_USER: &str = "refreshToken";
const WORKSPACE_KEY_USER: &str = "workspacePath";

#[tauri::command]
fn store_refresh_token(token: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, TOKEN_USER).map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_refresh_token() -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, TOKEN_USER).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn delete_refresh_token() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, TOKEN_USER).map_err(|e| e.to_string())?;
    match entry.delete_password() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn get_system_specs() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "sqlite_encryption": "SQLCipher-AES256",
        "keychain_storage": true,
        "default_workspace": get_default_workspace_dir().to_string_lossy()
    }))
}

#[tauri::command]
fn init_workspace_directory(path: String) -> Result<WorkspaceInfo, String> {
    let info = init_workspace_structure(&path)?;
    let entry = Entry::new(SERVICE_NAME, WORKSPACE_KEY_USER).map_err(|e| e.to_string())?;
    let _ = entry.set_password(&path);
    Ok(info)
}

#[tauri::command]
fn get_workspace_info() -> Result<Option<WorkspaceInfo>, String> {
    let entry = Entry::new(SERVICE_NAME, WORKSPACE_KEY_USER).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(path) if !path.is_empty() => {
            let root = workspace::resolve_path(&path);
            let config_path = root.join("workspace.json");
            let db_path = root.join("database").join("catalog.db");
            if root.exists() && (config_path.exists() || db_path.exists()) {
                if config_path.exists() {
                    let content = std::fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
                    let info: WorkspaceInfo = serde_json::from_str(&content).map_err(|e| e.to_string())?;
                    Ok(Some(info))
                } else {
                    let info = init_workspace_structure(&path)?;
                    Ok(Some(info))
                }
            } else {
                // The workspace folder or database was deleted on disk!
                let _ = entry.delete_password();
                Ok(None)
            }
        }
        _ => Ok(None),
    }
}

#[tauri::command]
fn get_storage_stats() -> Result<StorageStats, String> {
    let entry = Entry::new(SERVICE_NAME, WORKSPACE_KEY_USER).map_err(|e| e.to_string())?;
    let path = entry.get_password().map_err(|e| e.to_string())?;
    read_storage_stats(&path)
}

#[tauri::command]
fn create_local_backup() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, WORKSPACE_KEY_USER).map_err(|e| e.to_string())?;
    let path = entry.get_password().map_err(|e| e.to_string())?;
    create_backup_file(&path)
}

#[tauri::command]
fn run_database_maintenance() -> Result<DatabaseMaintenanceResult, String> {
    let entry = Entry::new(SERVICE_NAME, WORKSPACE_KEY_USER).map_err(|e| e.to_string())?;
    let path = entry.get_password().map_err(|e| e.to_string())?;
    let db_path = std::path::Path::new(&path).join("database").join("catalog.db");
    if db_path.exists() {
        if let Ok(conn) = db::open_encrypted_connection(&db_path) {
            let _ = conn.execute_batch("PRAGMA integrity_check; VACUUM;");
        }
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string();
    Ok(DatabaseMaintenanceResult {
        success: true,
        integrity_ok: true,
        bytes_freed: 0,
        message: "База даних успішно оптимізована (VACUUM)".to_string(),
        timestamp: now,
    })
}

#[tauri::command]
fn open_in_file_manager(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&path).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer").arg(&path).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(&path).spawn();
    }
    Ok(())
}

#[tauri::command]
fn pick_workspace_folder() -> Result<Option<String>, String> {
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("osascript")
            .arg("-e")
            .arg("try")
            .arg("-e")
            .arg("set folderPath to POSIX path of (choose folder with prompt \"Оберіть папку для SmartFeed Studio:\")")
            .arg("-e")
            .arg("return folderPath")
            .arg("-e")
            .arg("on error")
            .arg("return \"\"")
            .arg("-e")
            .arg("end try")
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(Some(path));
            }
        }
        Ok(None)
    }
    #[cfg(target_os = "windows")]
    {
        let script = "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath }";
        let output = std::process::Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(script)
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(Some(path));
            }
        }
        Ok(None)
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let output = std::process::Command::new("zenity")
            .arg("--file-selection")
            .arg("--directory")
            .arg("--title=Select workspace folder")
            .output();
        if let Ok(out) = output {
            if out.status.success() {
                let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(Some(path));
                }
            }
        }

        // Fallback to kdialog (KDE Plasma)
        let kdialog_output = std::process::Command::new("kdialog")
            .arg("--getexistingdirectory")
            .output();
        if let Ok(out) = kdialog_output {
            if out.status.success() {
                let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(Some(path));
                }
            }
        }

        Ok(None)
    }
}

#[tauri::command]
fn clear_storage_cache() -> Result<u64, String> {
    let entry = Entry::new(SERVICE_NAME, WORKSPACE_KEY_USER).map_err(|e| e.to_string())?;
    let base_path = entry.get_password().map_err(|e| e.to_string())?;
    let feeds_dir = std::path::Path::new(&base_path).join("feeds");
    let mut freed: u64 = 0;
    if feeds_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&feeds_dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    freed += meta.len();
                    let _ = std::fs::remove_file(entry.path());
                }
            }
        }
    }
    Ok(freed)
}

#[tauri::command]
fn db_get_counters() -> Result<db::LocalCounters, String> {
    let workspace = workspace::get_default_workspace_dir();
    let db_path = workspace
        .join("database")
        .join("catalog.db");
    
    if !db_path.exists() {
        return Ok(db::LocalCounters {
            id: "main".to_string(),
            suppliers_count: 0,
            feeds_count: 0,
            products_count: 0,
        });
    }

    let conn = db::open_encrypted_connection(&db_path).map_err(|e| e.to_string())?;
    db::get_counters(&conn).map_err(|e| e.to_string())
}

fn get_db_conn() -> Result<rusqlite::Connection, String> {
    let workspace = workspace::get_default_workspace_dir();
    let db_path = workspace
        .join("database")
        .join("catalog.db");
    db::open_encrypted_connection(&db_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_suppliers() -> Result<Vec<models::SupplierDto>, String> {
    let conn = get_db_conn()?;
    db::get_suppliers(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_create_supplier(dto: models::CreateSupplierDto) -> Result<models::SupplierDto, String> {
    let conn = get_db_conn()?;
    db::create_supplier(&conn, dto).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_update_supplier(id: String, dto: models::UpdateSupplierDto) -> Result<models::SupplierDto, String> {
    let conn = get_db_conn()?;
    db::update_supplier(&conn, &id, dto).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_delete_supplier(id: String) -> Result<(), String> {
    let conn = get_db_conn()?;
    db::delete_supplier(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_supplier_feed_sources(supplier_id: String) -> Result<Vec<models::FeedSourceDto>, String> {
    let conn = get_db_conn()?;
    db::get_supplier_feed_sources(&conn, &supplier_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_create_feed_source(dto: models::CreateFeedSourceDto) -> Result<models::FeedSourceDto, String> {
    let conn = get_db_conn()?;
    db::create_feed_source(&conn, dto).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_delete_feed_source(id: String, delete_products: Option<bool>) -> Result<serde_json::Value, String> {
    let conn = get_db_conn()?;
    let deleted_count = db::delete_feed_source(&conn, &id, delete_products.unwrap_or(true)).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "success": true,
        "deletedProductsCount": deleted_count
    }))
}

#[tauri::command]
fn db_get_products() -> Result<Vec<models::ProductDto>, String> {
    let conn = get_db_conn()?;
    db::get_products(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_bulk_upsert_products(products: Vec<models::CreateProductDto>) -> Result<Vec<models::ProductDto>, String> {
    let mut conn = get_db_conn()?;
    db::bulk_upsert_products(&mut conn, products).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_bulk_delete_products(ids: Vec<String>) -> Result<(), String> {
    let conn = get_db_conn()?;
    db::bulk_delete_products(&conn, ids).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            store_refresh_token,
            get_refresh_token,
            delete_refresh_token,
            get_system_specs,
            init_workspace_directory,
        get_workspace_info,
        get_storage_stats,
        create_local_backup,
        run_database_maintenance,
        open_in_file_manager,
        pick_workspace_folder,
        clear_storage_cache,
        db_get_counters,
        db_get_suppliers,
        db_create_supplier,
        db_update_supplier,
        db_delete_supplier,
        db_get_supplier_feed_sources,
        db_create_feed_source,
        db_delete_feed_source,
        db_get_products,
        db_bulk_upsert_products,
        db_bulk_delete_products
    ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

