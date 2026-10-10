# Rust IPC Boundary & Input Validation Architecture

## 1. Захист від Path Traversal (CWE-22)

Користувач у React-компоненті може передати шлях до файлу (наприклад, для імпорту CSV або експорту зліпка).
Якщо передати `../../../../etc/passwd` або завантажити файл за межі дозволеної папки, наївний код відкриє вразливість витоку даних.

### Канонічний патерн канонікалізації шляхів у Rust:

```rust
use std::path::{Path, PathBuf};
use tauri::AppHandle;

pub fn validate_safe_feed_path(
    app: &AppHandle,
    untrusted_path_str: &str
) -> Result<PathBuf, String> {
    let untrusted_path = Path::new(untrusted_path_str);

    // 1. Отримуємо абсолютний канонічний шлях
    let canonical = dunce::canonicalize(untrusted_path)
        .map_err(|e| format!("Невалідний шлях до файлу: {}", e))?;

    // 2. Отримуємо дозволений базовий каталог додатку
    let allowed_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let canonical_allowed = dunce::canonicalize(&allowed_dir)
        .unwrap_or(allowed_dir);

    // 3. Сувора перевірка приналежності до пісочниці
    if !canonical.starts_with(&canonical_allowed) {
        return Err("Доступ заборонено: спроба виходу за межі дозволеного каталогу (Path Traversal)".into());
    }

    Ok(canonical)
}
```

## 2. Сувора типізація команд `#[tauri::command]`

Замість використання `serde_json::Value` усі аргументи та відповіді повинні мати точні структури:

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

    // Виконання імпорту через захищений шлях
    let count = run_safe_import(&safe_path, payload.max_items).await?;

    Ok(ImportFeedResponse {
        success: true,
        imported_count: count,
    })
}
```

## 3. Чеклист безпеки IPC команд

- [ ] Жодна команда не приймає сирі shell-команди для виконання.
- [ ] Усі помилки серіалізуються у зрозумілий рядок без витоку внутрішніх системних шляхів до файлів компіляції (`file!()`, `line!()`).
- [ ] При асинхронних важких операціях використовується `tauri::async_runtime::spawn_blocking`.
