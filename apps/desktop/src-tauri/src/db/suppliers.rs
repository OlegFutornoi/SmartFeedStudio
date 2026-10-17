use rusqlite::{params, Connection, Result};
use crate::models::{
    SupplierDto, CreateSupplierDto, UpdateSupplierDto,
    SupplierCategoryRuleDto, SupplierPricingRuleDto,
};
use super::sync_counters;

pub fn get_suppliers(conn: &Connection) -> Result<Vec<SupplierDto>> {
    let mut stmt = conn.prepare(
        "SELECT 
            s.id, s.organization_id, s.user_id, s.name, s.code, s.contact_phone, s.contact_email, s.website, s.notes, s.logo_url,
            s.legal_name, s.tax_id, s.industry, s.segment, s.manager_name, s.manager_position, s.manager_phone, s.manager_email, s.manager_telegram, s.country, s.city, s.address, s.postcode,
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
            legal_name: row.get(10)?,
            tax_id: row.get(11)?,
            industry: row.get(12)?,
            segment: row.get(13)?,
            manager_name: row.get(14)?,
            manager_position: row.get(15)?,
            manager_phone: row.get(16)?,
            manager_email: row.get(17)?,
            manager_telegram: row.get(18)?,
            country: row.get(19)?,
            city: row.get(20)?,
            address: row.get(21)?,
            postcode: row.get(22)?,
            base_currency: row.get(23)?,
            target_currency: row.get(24)?,
            exchange_rate_mode: row.get(25)?,
            exchange_rate: row.get(26)?,
            currency_buffer_percent: row.get(27)?,
            price_rounding: row.get(28)?,
            default_margin_percent: row.get(29)?,
            default_fixed_markup: row.get(30)?,
            is_active: row.get::<_, i32>(31)? == 1,
            created_at: row.get(32)?,
            updated_at: row.get(33)?,
            products_count: Some(row.get::<_, u32>(34).unwrap_or(0)),
            active_feeds_count: Some(row.get::<_, u32>(35).unwrap_or(0)),
            categories_count: Some(row.get::<_, u32>(36).unwrap_or(0)),
            active_categories_count: Some(row.get::<_, u32>(37).unwrap_or(0)),
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
            s.legal_name, s.tax_id, s.industry, s.segment, s.manager_name, s.manager_position, s.manager_phone, s.manager_email, s.manager_telegram, s.country, s.city, s.address, s.postcode,
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
            legal_name: row.get(10)?,
            tax_id: row.get(11)?,
            industry: row.get(12)?,
            segment: row.get(13)?,
            manager_name: row.get(14)?,
            manager_position: row.get(15)?,
            manager_phone: row.get(16)?,
            manager_email: row.get(17)?,
            manager_telegram: row.get(18)?,
            country: row.get(19)?,
            city: row.get(20)?,
            address: row.get(21)?,
            postcode: row.get(22)?,
            base_currency: row.get(23)?,
            target_currency: row.get(24)?,
            exchange_rate_mode: row.get(25)?,
            exchange_rate: row.get(26)?,
            currency_buffer_percent: row.get(27)?,
            price_rounding: row.get(28)?,
            default_margin_percent: row.get(29)?,
            default_fixed_markup: row.get(30)?,
            is_active: row.get::<_, i32>(31)? == 1,
            created_at: row.get(32)?,
            updated_at: row.get(33)?,
            products_count: Some(row.get::<_, u32>(34).unwrap_or(0)),
            active_feeds_count: Some(row.get::<_, u32>(35).unwrap_or(0)),
            categories_count: Some(row.get::<_, u32>(36).unwrap_or(0)),
            active_categories_count: Some(row.get::<_, u32>(37).unwrap_or(0)),
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
            legal_name, tax_id, industry, segment, manager_name, manager_position, manager_phone, manager_email, manager_telegram, country, city, address, postcode,
            base_currency, target_currency, exchange_rate_mode, exchange_rate, currency_buffer_percent, price_rounding,
            default_margin_percent, default_fixed_markup, is_active
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9,
            ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22,
            ?23, ?24, ?25, ?26, ?27, ?28,
            ?29, ?30, ?31
        )",
        params![
            &id, &user_id, &dto.name, &dto.code, &dto.contact_phone, &dto.contact_email, &dto.website, &dto.notes, &dto.logo_url,
            &dto.legal_name, &dto.tax_id, &dto.industry, &dto.segment, &dto.manager_name, &dto.manager_position, &dto.manager_phone, &dto.manager_email, &dto.manager_telegram, &dto.country, &dto.city, &dto.address, &dto.postcode,
            &base_currency, &target_currency, &exchange_rate_mode, exchange_rate, currency_buffer_percent, &price_rounding,
            dto.default_margin_percent, dto.default_fixed_markup, if is_active { 1 } else { 0 },
        ],
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
        legal_name: dto.legal_name,
        tax_id: dto.tax_id,
        industry: dto.industry,
        segment: dto.segment,
        manager_name: dto.manager_name,
        manager_position: dto.manager_position,
        manager_phone: dto.manager_phone,
        manager_email: dto.manager_email,
        manager_telegram: dto.manager_telegram,
        country: dto.country,
        city: dto.city,
        address: dto.address,
        postcode: dto.postcode,
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
    let legal_name = dto.legal_name.or(current_supplier.legal_name);
    let tax_id = dto.tax_id.or(current_supplier.tax_id);
    let industry = dto.industry.or(current_supplier.industry);
    let segment = dto.segment.or(current_supplier.segment);
    let manager_name = dto.manager_name.or(current_supplier.manager_name);
    let manager_position = dto.manager_position.or(current_supplier.manager_position);
    let manager_phone = dto.manager_phone.or(current_supplier.manager_phone);
    let manager_email = dto.manager_email.or(current_supplier.manager_email);
    let manager_telegram = dto.manager_telegram.or(current_supplier.manager_telegram);
    let country = dto.country.or(current_supplier.country);
    let city = dto.city.or(current_supplier.city);
    let address = dto.address.or(current_supplier.address);
    let postcode = dto.postcode.or(current_supplier.postcode);
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
            notes = ?6, logo_url = ?7, legal_name = ?8, tax_id = ?9, industry = ?10, segment = ?11,
            manager_name = ?12, manager_position = ?13, manager_phone = ?14, manager_email = ?15, manager_telegram = ?16,
            country = ?17, city = ?18, address = ?19, postcode = ?20,
            base_currency = ?21, target_currency = ?22, exchange_rate_mode = ?23,
            exchange_rate = ?24, currency_buffer_percent = ?25, price_rounding = ?26,
            default_margin_percent = ?27, default_fixed_markup = ?28,
            is_active = ?29, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?30",
        params![
            &name, &code, &contact_phone, &contact_email, &website,
            &notes, &logo_url, &legal_name, &tax_id, &industry, &segment,
            &manager_name, &manager_position, &manager_phone, &manager_email, &manager_telegram,
            &country, &city, &address, &postcode,
            &base_currency, &target_currency, &exchange_rate_mode,
            exchange_rate, currency_buffer_percent, &price_rounding,
            default_margin_percent, default_fixed_markup,
            if is_active { 1 } else { 0 }, id,
        ],
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
