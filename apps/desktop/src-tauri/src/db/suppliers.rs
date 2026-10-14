use rusqlite::{Connection, Result};
use crate::models::{
    SupplierDto, CreateSupplierDto, UpdateSupplierDto,
    SupplierCategoryRuleDto, SupplierPricingRuleDto,
};
use super::sync_counters;

pub fn get_suppliers(conn: &Connection) -> Result<Vec<SupplierDto>> {
    let mut stmt = conn.prepare(
        "SELECT 
            s.id, s.organization_id, s.user_id, s.name, s.code, s.contact_phone, s.contact_email, s.website, s.notes, s.logo_url,
            COALESCE(s.base_currency, 'UAH'), COALESCE(s.target_currency, 'UAH'), COALESCE(s.exchange_rate_mode, 'MANUAL'),
            COALESCE(s.exchange_rate, 1.0), COALESCE(s.currency_buffer_percent, 0.0), COALESCE(s.price_rounding, 'NONE'),
            s.default_margin_percent, s.default_fixed_markup, s.is_active, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM local_products p WHERE p.supplier_id = s.id) AS products_count,
            (SELECT COUNT(*) FROM local_feed_sources f WHERE f.supplier_id = s.id) AS active_feeds_count,
            (SELECT COUNT(*) FROM local_supplier_categories c WHERE c.supplier_id = s.id) AS categories_count,
            (SELECT COUNT(*) FROM local_supplier_categories c WHERE c.supplier_id = s.id AND c.is_active = 1) AS active_categories_count
        FROM local_suppliers s
        ORDER BY s.created_at DESC"
    )?;
    
    let supplier_iter = stmt.query_map([], |row| {
        Ok(SupplierDto {
            id: row.get(0)?,
            organization_id: row.get(1)?,
            user_id: row.get(2)?,
            name: row.get(3)?,
            code: row.get(4)?,
            contact_phone: row.get(5)?,
            contact_email: row.get(6)?,
            website: row.get(7)?,
            notes: row.get(8)?,
            logo_url: row.get(9)?,
            base_currency: row.get(10)?,
            target_currency: row.get(11)?,
            exchange_rate_mode: row.get(12)?,
            exchange_rate: row.get(13)?,
            currency_buffer_percent: row.get(14)?,
            price_rounding: row.get(15)?,
            default_margin_percent: row.get(16)?,
            default_fixed_markup: row.get(17)?,
            is_active: row.get::<_, i32>(18)? == 1,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
            products_count: Some(row.get::<_, u32>(21).unwrap_or(0)),
            active_feeds_count: Some(row.get::<_, u32>(22).unwrap_or(0)),
            categories_count: Some(row.get::<_, u32>(23).unwrap_or(0)),
            active_categories_count: Some(row.get::<_, u32>(24).unwrap_or(0)),
        })
    })?;

    let mut suppliers = Vec::new();
    for supplier in supplier_iter {
        suppliers.push(supplier?);
    }
    
    Ok(suppliers)
}

pub fn get_supplier_by_id(conn: &Connection, id: &str) -> Result<Option<SupplierDto>> {
    let mut stmt = conn.prepare(
        "SELECT 
            s.id, s.organization_id, s.user_id, s.name, s.code, s.contact_phone, s.contact_email, s.website, s.notes, s.logo_url,
            COALESCE(s.base_currency, 'UAH'), COALESCE(s.target_currency, 'UAH'), COALESCE(s.exchange_rate_mode, 'MANUAL'),
            COALESCE(s.exchange_rate, 1.0), COALESCE(s.currency_buffer_percent, 0.0), COALESCE(s.price_rounding, 'NONE'),
            s.default_margin_percent, s.default_fixed_markup, s.is_active, s.created_at, s.updated_at,
            (SELECT COUNT(*) FROM local_products p WHERE p.supplier_id = s.id) AS products_count,
            (SELECT COUNT(*) FROM local_feed_sources f WHERE f.supplier_id = s.id) AS active_feeds_count,
            (SELECT COUNT(*) FROM local_supplier_categories c WHERE c.supplier_id = s.id) AS categories_count,
            (SELECT COUNT(*) FROM local_supplier_categories c WHERE c.supplier_id = s.id AND c.is_active = 1) AS active_categories_count
        FROM local_suppliers s
        WHERE s.id = ?1"
    )?;

    let mut rows = stmt.query([id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(SupplierDto {
            id: row.get(0)?,
            organization_id: row.get(1)?,
            user_id: row.get(2)?,
            name: row.get(3)?,
            code: row.get(4)?,
            contact_phone: row.get(5)?,
            contact_email: row.get(6)?,
            website: row.get(7)?,
            notes: row.get(8)?,
            logo_url: row.get(9)?,
            base_currency: row.get(10)?,
            target_currency: row.get(11)?,
            exchange_rate_mode: row.get(12)?,
            exchange_rate: row.get(13)?,
            currency_buffer_percent: row.get(14)?,
            price_rounding: row.get(15)?,
            default_margin_percent: row.get(16)?,
            default_fixed_markup: row.get(17)?,
            is_active: row.get::<_, i32>(18)? == 1,
            created_at: row.get(19)?,
            updated_at: row.get(20)?,
            products_count: Some(row.get::<_, u32>(21).unwrap_or(0)),
            active_feeds_count: Some(row.get::<_, u32>(22).unwrap_or(0)),
            categories_count: Some(row.get::<_, u32>(23).unwrap_or(0)),
            active_categories_count: Some(row.get::<_, u32>(24).unwrap_or(0)),
        }))
    } else {
        Ok(None)
    }
}

pub fn create_supplier(conn: &Connection, dto: CreateSupplierDto) -> Result<SupplierDto> {
    let id = format!("sf_supplier_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
    let user_id = "local_user".to_string();
    let base_currency = dto.base_currency.unwrap_or_else(|| "UAH".to_string());
    let target_currency = dto.target_currency.unwrap_or_else(|| "UAH".to_string());
    let exchange_rate_mode = dto.exchange_rate_mode.unwrap_or_else(|| "MANUAL".to_string());
    let exchange_rate = dto.exchange_rate.unwrap_or(1.0);
    let currency_buffer_percent = dto.currency_buffer_percent.unwrap_or(0.0);
    let price_rounding = dto.price_rounding.unwrap_or_else(|| "NONE".to_string());
    let is_active = dto.is_active.unwrap_or(true);
    
    conn.execute(
        "INSERT INTO local_suppliers (
            id, user_id, name, code, contact_phone, contact_email, website, notes, logo_url,
            base_currency, target_currency, exchange_rate_mode, exchange_rate, currency_buffer_percent, price_rounding,
            default_margin_percent, default_fixed_markup, is_active
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
        (
            &id, &user_id, &dto.name, &dto.code, &dto.contact_phone, &dto.contact_email, &dto.website, &dto.notes, &dto.logo_url,
            &base_currency, &target_currency, &exchange_rate_mode, exchange_rate, currency_buffer_percent, &price_rounding,
            dto.default_margin_percent, dto.default_fixed_markup, if is_active { 1 } else { 0 },
        ),
    )?;

    let _ = sync_counters(conn);

    Ok(SupplierDto {
        id,
        organization_id: None,
        user_id,
        name: dto.name,
        code: dto.code,
        contact_phone: dto.contact_phone,
        contact_email: dto.contact_email,
        website: dto.website,
        notes: dto.notes,
        logo_url: dto.logo_url,
        base_currency,
        target_currency,
        exchange_rate_mode,
        exchange_rate,
        currency_buffer_percent,
        price_rounding,
        default_margin_percent: dto.default_margin_percent,
        default_fixed_markup: dto.default_fixed_markup,
        is_active,
        products_count: Some(0),
        active_feeds_count: Some(0),
        categories_count: Some(0),
        active_categories_count: Some(0),
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn delete_supplier(conn: &Connection, id: &str) -> Result<()> {
    let _ = conn.execute("DELETE FROM local_supplier_categories WHERE supplier_id = ?1", [id]);
    let _ = conn.execute("DELETE FROM local_supplier_pricing_rules WHERE supplier_id = ?1", [id]);
    let _ = conn.execute(
        "DELETE FROM local_product_images WHERE product_id IN (SELECT id FROM local_products WHERE supplier_id = ?1)",
        [id],
    );
    let _ = conn.execute("DELETE FROM local_products WHERE supplier_id = ?1", [id]);
    let _ = conn.execute("DELETE FROM local_feed_sources WHERE supplier_id = ?1", [id]);
    conn.execute("DELETE FROM local_suppliers WHERE id = ?1", [id])?;
    let _ = sync_counters(conn);
    Ok(())
}

pub fn update_supplier(conn: &Connection, id: &str, dto: UpdateSupplierDto) -> Result<SupplierDto> {
    let current_supplier = match get_supplier_by_id(conn, id)? {
        Some(s) => s,
        None => return Err(rusqlite::Error::QueryReturnedNoRows),
    };

    let name = dto.name.unwrap_or(current_supplier.name);
    let code = dto.code.unwrap_or(current_supplier.code);
    let contact_phone = dto.contact_phone.or(current_supplier.contact_phone);
    let contact_email = dto.contact_email.or(current_supplier.contact_email);
    let website = dto.website.or(current_supplier.website);
    let notes = dto.notes.or(current_supplier.notes);
    let logo_url = dto.logo_url.or(current_supplier.logo_url);
    let base_currency = dto.base_currency.unwrap_or(current_supplier.base_currency);
    let target_currency = dto.target_currency.unwrap_or(current_supplier.target_currency);
    let exchange_rate_mode = dto.exchange_rate_mode.unwrap_or(current_supplier.exchange_rate_mode);
    let exchange_rate = dto.exchange_rate.unwrap_or(current_supplier.exchange_rate);
    let currency_buffer_percent = dto.currency_buffer_percent.unwrap_or(current_supplier.currency_buffer_percent);
    let price_rounding = dto.price_rounding.unwrap_or(current_supplier.price_rounding);
    let default_margin_percent = dto.default_margin_percent.unwrap_or(current_supplier.default_margin_percent);
    let default_fixed_markup = dto.default_fixed_markup.unwrap_or(current_supplier.default_fixed_markup);
    let is_active = dto.is_active.unwrap_or(current_supplier.is_active);

    conn.execute(
        "UPDATE local_suppliers SET
            name = ?1, code = ?2, contact_phone = ?3, contact_email = ?4, website = ?5,
            notes = ?6, logo_url = ?7, base_currency = ?8, target_currency = ?9, exchange_rate_mode = ?10,
            exchange_rate = ?11, currency_buffer_percent = ?12, price_rounding = ?13,
            default_margin_percent = ?14, default_fixed_markup = ?15,
            is_active = ?16, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?17",
        (
            &name, &code, &contact_phone, &contact_email, &website,
            &notes, &logo_url, &base_currency, &target_currency, &exchange_rate_mode,
            exchange_rate, currency_buffer_percent, &price_rounding,
            default_margin_percent, default_fixed_markup,
            if is_active { 1 } else { 0 }, id,
        ),
    )?;

    get_supplier_by_id(conn, id).map(|opt| opt.unwrap())
}

pub fn get_supplier_categories(conn: &Connection, supplier_id: &str) -> Result<Vec<SupplierCategoryRuleDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, supplier_id, feed_category_id, name, parent_id, is_active, margin_percent, fixed_markup, product_count, created_at, updated_at
         FROM local_supplier_categories
         WHERE supplier_id = ?1
         ORDER BY name ASC"
    )?;

    let iter = stmt.query_map([supplier_id], |row| {
        Ok(SupplierCategoryRuleDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            feed_category_id: row.get(2)?,
            name: row.get(3)?,
            parent_id: row.get(4)?,
            is_active: row.get::<_, i32>(5)? == 1,
            margin_percent: row.get(6)?,
            fixed_markup: row.get(7)?,
            product_count: row.get::<_, u32>(8).unwrap_or(0),
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    })?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item?);
    }
    Ok(list)
}

pub fn get_supplier_pricing_rules(conn: &Connection, supplier_id: &str) -> Result<Vec<SupplierPricingRuleDto>> {
    let mut stmt = conn.prepare(
        "SELECT id, supplier_id, category_id, category_name_uk, min_price, max_price, margin_percent, fixed_markup, priority, is_active, created_at, updated_at
         FROM local_supplier_pricing_rules
         WHERE supplier_id = ?1
         ORDER BY priority ASC, created_at ASC"
    )?;

    let iter = stmt.query_map([supplier_id], |row| {
        Ok(SupplierPricingRuleDto {
            id: row.get(0)?,
            supplier_id: row.get(1)?,
            category_id: row.get(2)?,
            category_name_uk: row.get(3)?,
            min_price: row.get(4)?,
            max_price: row.get(5)?,
            margin_percent: row.get(6)?,
            fixed_markup: row.get(7)?,
            priority: row.get(8)?,
            is_active: row.get::<_, i32>(9)? == 1,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item?);
    }
    Ok(list)
}
