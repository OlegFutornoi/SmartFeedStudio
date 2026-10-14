use rusqlite::{params, Connection, Result};
use crate::models::{ProductDto, CreateProductDto, CategorySummaryDto};
use super::sync_counters;

pub fn get_products(conn: &Connection) -> Result<Vec<ProductDto>> {
    let mut stmt = conn.prepare(
        "SELECT 
            p.id, p.catalog_id, p.supplier_id, s.name, s.code,
            p.feed_source_id, p.category_id, p.category_name_uk,
            p.sku, p.external_id, p.barcode, p.vendor_code,
            p.title_uk, p.title_en, p.description_uk, p.description_en,
            p.vendor, p.cost_price, p.price, p.old_price, p.currency,
            p.stock_quantity, p.in_stock, p.status, p.raw_payload,
            p.created_at, p.updated_at
        FROM local_products p
        LEFT JOIN local_suppliers s ON s.id = p.supplier_id
        ORDER BY p.created_at DESC"
    )?;
    
    let product_iter = stmt.query_map([], |row| {
        Ok(ProductDto {
            id: row.get(0)?,
            catalog_id: row.get(1)?,
            supplier_id: row.get(2)?,
            supplier_name: row.get(3)?,
            supplier_code: row.get(4)?,
            feed_source_id: row.get(5)?,
            category_id: row.get(6)?,
            category_name_uk: row.get(7)?,
            sku: row.get(8)?,
            external_id: row.get(9)?,
            barcode: row.get(10)?,
            vendor_code: row.get(11)?,
            title_uk: row.get(12)?,
            title_en: row.get(13)?,
            description_uk: row.get(14)?,
            description_en: row.get(15)?,
            vendor: row.get(16)?,
            cost_price: row.get(17)?,
            price: row.get(18)?,
            old_price: row.get(19)?,
            currency: row.get(20)?,
            stock_quantity: row.get(21)?,
            in_stock: row.get::<_, i32>(22)? == 1,
            status: row.get(23)?,
            raw_payload: row.get(24)?,
            created_at: row.get(25)?,
            updated_at: row.get(26)?,
            images: vec![],
        })
    })?;

    let mut products = Vec::new();
    for product in product_iter {
        products.push(product?);
    }
    
    let ids: Vec<String> = products.iter().map(|p| p.id.clone()).collect();
    if let Ok(images_map) = crate::images::db::get_images_for_products(conn, &ids) {
        for prod in &mut products {
            if let Some(imgs) = images_map.get(&prod.id) {
                prod.images = imgs.clone();
            }
        }
    }
    
    Ok(products)
}

pub fn bulk_upsert_products(conn: &mut Connection, products: Vec<CreateProductDto>) -> Result<Vec<ProductDto>> {
    let tx = conn.transaction()?;
    let mut returned_products = Vec::new();
    
    {
        let mut stmt = tx.prepare(
            "INSERT INTO local_products (
                id, catalog_id, supplier_id, feed_source_id, category_id, category_name_uk,
                sku, external_id, barcode, vendor_code, title_uk, title_en, description_uk,
                description_en, vendor, cost_price, price, old_price, currency, stock_quantity,
                in_stock, status, created_at, updated_at
             ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
             )
             ON CONFLICT(id) DO UPDATE SET
                title_uk = excluded.title_uk,
                category_id = excluded.category_id,
                category_name_uk = excluded.category_name_uk,
                feed_source_id = excluded.feed_source_id,
                cost_price = excluded.cost_price,
                price = excluded.price,
                stock_quantity = excluded.stock_quantity,
                in_stock = excluded.in_stock,
                updated_at = CURRENT_TIMESTAMP",
        )?;

        for dto in products {
            let id = dto.id.unwrap_or_else(|| format!("sf_prod_{}_{}", &dto.supplier_id, &dto.sku));
            
            stmt.execute(params![
                &id,
                dto.catalog_id.as_deref().unwrap_or("default_catalog"),
                &dto.supplier_id,
                &dto.feed_source_id,
                &dto.category_id,
                &dto.category_name_uk,
                &dto.sku,
                &dto.external_id,
                &dto.barcode,
                &dto.vendor_code,
                &dto.title_uk,
                &dto.title_en,
                &dto.description_uk,
                &dto.description_en,
                &dto.vendor,
                dto.cost_price,
                dto.price,
                dto.old_price,
                &dto.currency,
                dto.stock_quantity,
                if dto.in_stock { 1 } else { 0 },
                &dto.status,
            ])?;

            let mut prod_images = Vec::new();
            for img_dto in &dto.images {
                if let Ok(inserted) = crate::images::db::insert_product_image(&tx, img_dto, &id) {
                    prod_images.push(inserted);
                }
            }

            returned_products.push(ProductDto {
                id,
                catalog_id: dto.catalog_id.unwrap_or_else(|| "default_catalog".to_string()),
                supplier_id: dto.supplier_id,
                supplier_name: None,
                supplier_code: None,
                feed_source_id: dto.feed_source_id,
                category_id: dto.category_id,
                category_name_uk: dto.category_name_uk,
                sku: dto.sku,
                external_id: dto.external_id,
                barcode: dto.barcode,
                vendor_code: dto.vendor_code,
                title_uk: dto.title_uk,
                title_en: dto.title_en,
                description_uk: dto.description_uk,
                description_en: dto.description_en,
                vendor: dto.vendor,
                cost_price: dto.cost_price,
                price: dto.price,
                old_price: dto.old_price,
                currency: dto.currency,
                stock_quantity: dto.stock_quantity,
                in_stock: dto.in_stock,
                status: dto.status,
                raw_payload: None,
                images: prod_images,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
            });
        }
    }
    
    tx.commit()?;
    let _ = sync_counters(conn);
    Ok(returned_products)
}

pub fn bulk_delete_products(conn: &Connection, ids: Vec<String>) -> Result<()> {
    for id in ids {
        conn.execute("DELETE FROM local_products WHERE id = ?1", [&id])?;
    }
    let _ = sync_counters(conn);
    Ok(())
}

pub fn get_categories_summary(conn: &Connection, supplier_id: Option<&str>) -> Result<Vec<CategorySummaryDto>> {
    let has_supplier = supplier_id.map(|s| !s.is_empty()).unwrap_or(false);
    let mut query = "SELECT 
        COALESCE(category_id, 'cat_none') AS cat_id,
        COALESCE(category_name_uk, 'Без категорії') AS cat_name,
        COUNT(*) AS cnt
    FROM local_products".to_string();

    if has_supplier {
        query.push_str(" WHERE supplier_id = ?1");
    }
    query.push_str(" GROUP BY cat_id, cat_name ORDER BY cnt DESC");

    let mut stmt = conn.prepare(&query)?;
    let mut results = Vec::new();

    if has_supplier {
        let iter = stmt.query_map(params![supplier_id.unwrap()], |row| {
            Ok(CategorySummaryDto {
                id: row.get(0)?,
                name_uk: row.get(1)?,
                product_count: row.get::<_, u32>(2)?,
            })
        })?;
        for item in iter {
            results.push(item?);
        }
    } else {
        let iter = stmt.query_map([], |row| {
            Ok(CategorySummaryDto {
                id: row.get(0)?,
                name_uk: row.get(1)?,
                product_count: row.get::<_, u32>(2)?,
            })
        })?;
        for item in iter {
            results.push(item?);
        }
    }

    Ok(results)
}
