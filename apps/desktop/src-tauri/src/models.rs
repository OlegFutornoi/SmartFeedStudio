use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SupplierDto {
    pub id: String,
    pub organization_id: Option<String>,
    pub user_id: String,
    pub name: String,
    pub code: String,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub website: Option<String>,
    pub notes: Option<String>,
    pub default_margin_percent: f64,
    pub default_fixed_markup: f64,
    pub is_active: bool,
    pub products_count: Option<u32>,
    pub active_feeds_count: Option<u32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateSupplierDto {
    pub name: String,
    pub code: String,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub website: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub default_margin_percent: f64,
    #[serde(default)]
    pub default_fixed_markup: f64,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSupplierDto {
    pub name: Option<String>,
    pub code: Option<String>,
    pub contact_phone: Option<String>,
    pub contact_email: Option<String>,
    pub website: Option<String>,
    pub notes: Option<String>,
    pub default_margin_percent: Option<f64>,
    pub default_fixed_markup: Option<f64>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FeedSourceDto {
    pub id: String,
    pub supplier_id: String,
    pub supplier_name: Option<String>,
    pub name: String,
    pub source_type: String,
    pub file_format: String,
    pub source_url: Option<String>,
    pub s3_file_key: Option<String>,
    pub auth_header_name: Option<String>,
    pub auth_header_value: Option<String>,
    pub sync_interval_hours: i32,
    pub auto_update_prices: bool,
    pub auto_update_stocks: bool,
    pub auto_create_new_products: bool,
    pub mapping_rules: Option<String>, // Keep as JSON string in Rust
    pub products_count: Option<u32>,
    pub last_synced_at: Option<String>,
    pub last_sync_status: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateFeedSourceDto {
    pub id: Option<String>,
    pub supplier_id: String,
    pub name: String,
    pub source_type: String,
    pub file_format: String,
    pub source_url: Option<String>,
    pub auth_header_name: Option<String>,
    pub auth_header_value: Option<String>,
    pub sync_interval_hours: i32,
    pub auto_update_prices: bool,
    pub auto_update_stocks: bool,
    pub auto_create_new_products: bool,
    pub mapping_rules: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProductDto {
    pub id: String,
    pub catalog_id: String,
    pub supplier_id: String,
    pub supplier_name: Option<String>,
    pub supplier_code: Option<String>,
    pub feed_source_id: Option<String>,
    pub category_id: Option<String>,
    pub category_name_uk: Option<String>,
    pub sku: String,
    pub external_id: Option<String>,
    pub barcode: Option<String>,
    pub vendor_code: Option<String>,
    pub title_uk: String,
    pub title_en: Option<String>,
    pub description_uk: Option<String>,
    pub description_en: Option<String>,
    pub vendor: Option<String>,
    pub cost_price: f64,
    pub price: f64,
    pub old_price: Option<f64>,
    pub currency: String,
    pub stock_quantity: i32,
    pub in_stock: bool,
    pub status: String,
    pub raw_payload: Option<String>, // JSON string
    #[serde(default)]
    pub images: Vec<LocalProductImageDto>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocalProductImageDto {
    pub id: String,
    pub product_id: String,
    pub original_url: String,
    pub local_path: Option<String>,
    pub thumbnail_path: Option<String>,
    pub file_hash: Option<String>,
    #[serde(default)]
    pub file_size: u64,
    pub mime_type: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    #[serde(default)]
    pub order: i32,
    #[serde(default)]
    pub is_main: bool,
    #[serde(default = "default_status")]
    pub status: String,
    pub download_error: Option<String>,
    #[serde(default)]
    pub retry_count: i32,
    pub s3_key: Option<String>,
    pub cloud_url: Option<String>,
    #[serde(default = "default_sync_status")]
    pub sync_status: String,
    pub last_synced_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

fn default_status() -> String {
    "PENDING".to_string()
}

fn default_sync_status() -> String {
    "LOCAL_ONLY".to_string()
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreateProductImageDto {
    pub product_id: Option<String>,
    pub original_url: String,
    #[serde(default)]
    pub order: i32,
    #[serde(default)]
    pub is_main: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProductImageOrderDto {
    pub product_id: String,
    pub image_ids_in_order: Vec<String>,
    pub main_image_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeleteProductImageResultDto {
    pub success: bool,
    pub image_id: String,
    pub file_deleted: bool,
    pub remaining_count: u32,
    pub new_main_image_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateProductDto {
    pub catalog_id: Option<String>,
    pub supplier_id: String,
    pub category_id: Option<String>,
    pub sku: String,
    pub external_id: Option<String>,
    pub barcode: Option<String>,
    pub vendor_code: Option<String>,
    pub title_uk: String,
    pub title_en: Option<String>,
    pub description_uk: Option<String>,
    pub description_en: Option<String>,
    pub vendor: Option<String>,
    pub cost_price: f64,
    pub price: f64,
    pub old_price: Option<f64>,
    pub currency: String,
    pub stock_quantity: i32,
    pub in_stock: bool,
    pub status: String,
    #[serde(default)]
    pub images: Vec<CreateProductImageDto>,
}
