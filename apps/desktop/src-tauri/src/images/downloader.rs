use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT, ACCEPT, REFERER};

pub struct DownloadedImageResult {
    pub file_hash: String,
    pub file_size: u64,
    pub mime_type: String,
    pub local_path: String,
    pub thumbnail_path: String,
}

pub fn detect_image_format(bytes: &[u8]) -> Option<(&'static str, &'static str)> {
    if bytes.len() < 12 {
        return None;
    }
    // JPEG: FF D8 FF
    if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return Some(("jpeg", "image/jpeg"));
    }
    // PNG: 89 50 4E 47
    if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        return Some(("png", "image/png"));
    }
    // WebP: RIFF .... WEBP
    if bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
        return Some(("webp", "image/webp"));
    }
    // GIF: GIF8
    if bytes.starts_with(b"GIF8") {
        return Some(("gif", "image/gif"));
    }
    None
}

// Compute simple hex hash from bytes
fn compute_content_hash(bytes: &[u8]) -> String {
    // 64-bit FNV-1a + length hash for fast deterministic local deduplication
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in bytes {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{:016x}{:08x}", hash, bytes.len())
}

pub async fn download_single_image(
    workspace_root: &Path,
    image_url: &str,
) -> Result<DownloadedImageResult, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) SmartFeedStudio/1.0"),
    );
    headers.insert(
        ACCEPT,
        HeaderValue::from_static("image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"),
    );
    if let Ok(parsed_url) = reqwest::Url::parse(image_url) {
        if let Some(host) = parsed_url.host_str() {
            if let Ok(val) = HeaderValue::from_str(&format!("https://{}/", host)) {
                headers.insert(REFERER, val);
            }
        }
    }

    let response = client
        .get(image_url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP Error {}", status.as_u16()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response stream: {}", e))?;

    if bytes.is_empty() {
        return Err("Empty image response (0 bytes)".to_string());
    }

    let (ext, mime) = detect_image_format(&bytes)
        .ok_or_else(|| "Invalid image format (magic bytes check failed)".to_string())?;

    let hash = compute_content_hash(&bytes);
    let staging_dir = workspace_root.join("images").join("staging");
    let temp_file_path = staging_dir.join(format!("{}.tmp", uuid::Uuid::new_v4()));

    // Ensure staging exists
    fs::create_dir_all(&staging_dir).map_err(|e| e.to_string())?;

    // Write to staging first
    let mut file = File::create(&temp_file_path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    drop(file);

    // Target paths
    let relative_original = super::storage::get_sharded_relative_path("originals", &hash, ext);
    let relative_thumb = super::storage::get_sharded_relative_path("thumbnails", &hash, ext);

    let full_original_path = workspace_root.join(&relative_original);
    let full_thumb_path = workspace_root.join(&relative_thumb);

    // Ensure parent folders exist
    if let Some(p) = full_original_path.parent() {
        fs::create_dir_all(p).map_err(|e| e.to_string())?;
    }
    if let Some(p) = full_thumb_path.parent() {
        fs::create_dir_all(p).map_err(|e| e.to_string())?;
    }

    // Atomic move to original
    fs::copy(&temp_file_path, &full_original_path).map_err(|e| e.to_string())?;
    let _ = fs::copy(&temp_file_path, &full_thumb_path); // Use as thumbnail
    let _ = fs::remove_file(&temp_file_path); // Clean staging

    Ok(DownloadedImageResult {
        file_hash: hash,
        file_size: bytes.len() as u64,
        mime_type: mime.to_string(),
        local_path: relative_original,
        thumbnail_path: relative_thumb,
    })
}
