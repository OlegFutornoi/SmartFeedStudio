# Rust IPC Boundary & Input Validation Architecture

## 1. Path Traversal Defense (CWE-22)

Desktop React components may provide user file paths (for instance, to import CSV or export snapshots).
If an unvalidated path like `../../../../etc/passwd` is provided, naive file operations expose security vulnerabilities.

### Canonical Path Canonicalization in Rust

```rust
use std::path::{Path, PathBuf};
use tauri::AppHandle;

pub fn validate_safe_feed_path(
    app: &AppHandle,
    untrusted_path_str: &str,
) -> Result<PathBuf, String> {
    let untrusted_path = Path::new(untrusted_path_str);

    // 1. Resolve absolute canonical path
    let canonical = dunce::canonicalize(untrusted_path)
        .map_err(|e| format!("Invalid file path: {}", e))?;

    // 2. Resolve authorized base application directory
    let allowed_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let canonical_allowed = dunce::canonicalize(&allowed_dir)
        .unwrap_or(allowed_dir);

    // 3. Strict sandbox boundary containment check
    if !canonical.starts_with(&canonical_allowed) {
        return Err("Access denied: path traversal attempt outside authorized directory".into());
    }

    Ok(canonical)
}
```

## 2. Strict Type Safety in `#[tauri::command]`

Instead of untyped `serde_json::Value`, all arguments and responses must declare discrete Rust structs:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ImportFeedPayload {
    pub feed_id: String,
    pub file_path: String,
    pub max_items: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct ImportFeedResponse {
    pub success: bool,
    pub imported_count: usize,
}

#[tauri::command]
pub async fn import_feed_command(
    app: tauri::AppHandle,
    payload: ImportFeedPayload,
) -> Result<ImportFeedResponse, String> {
    let safe_path = validate_safe_feed_path(&app, &payload.file_path)?;

    // Execute import using verified canonical path
    let count = run_safe_import(&safe_path, payload.max_items).await?;

    Ok(ImportFeedResponse {
        success: true,
        imported_count: count,
    })
}
```

## 3. IPC Command Security Checklist

- Zero commands accept raw shell command strings for execution.
- All errors serialize into user-safe error messages without leaking internal compiler paths (`file!()`, `line!()`).
- Heavy asynchronous workloads offload to `tauri::async_runtime::spawn_blocking`.
