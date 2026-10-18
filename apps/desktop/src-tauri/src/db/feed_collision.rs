use rusqlite::{params, Connection, Result};
use crate::models::{CheckFeedCollisionDto, FeedCollisionResultDto};

pub fn check_feed_collision(conn: &Connection, dto: CheckFeedCollisionDto) -> Result<FeedCollisionResultDto> {
    let candidate_name = dto.feed_name.clone().unwrap_or_else(|| "Фід товарів".to_string());
    let fp = dto.url_fingerprint.clone().unwrap_or_default();
    let canonical = dto.canonical_url.clone().unwrap_or_default();
    let raw_source_url = dto.source_url.clone().unwrap_or_default();
    let content_hash = dto.content_hash.clone().unwrap_or_default();
    let file_name = dto.file_name.clone().unwrap_or_default();
    let base_url = if let Some(idx) = raw_source_url.find('?') {
        raw_source_url[..idx].to_string()
    } else {
        raw_source_url.clone()
    };

    // 1. Check for exact same-supplier duplicate by url_fingerprint, canonical, source_url, base_url, content_hash or file_name
    let has_match_criteria = !fp.is_empty() || !raw_source_url.is_empty() || !content_hash.is_empty() || !file_name.is_empty();
    if has_match_criteria {
        let mut stmt = conn.prepare(
            "SELECT id, name, last_synced_at, 
                    (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = local_feed_sources.id) 
             FROM local_feed_sources 
             WHERE supplier_id = ?1 AND (
                 (?2 != '' AND url_fingerprint = ?2) OR
                 (?3 != '' AND canonical_url = ?3) OR
                 (?4 != '' AND source_url = ?4) OR
                 (?5 != '' AND source_url LIKE ?5 || '%') OR
                 (?4 != '' AND ?4 LIKE source_url || '%') OR
                 (?6 != '' AND content_hash = ?6) OR
                 (?7 != '' AND LOWER(TRIM(name)) = LOWER(TRIM(?7)))
             ) LIMIT 1"
        )?;
        let row_res = stmt.query_row(params![&dto.supplier_id, &fp, &canonical, &raw_source_url, &base_url, &content_hash, &file_name], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, Option<String>>(2)?,
                r.get::<_, u32>(3).unwrap_or(0),
            ))
        });

        if let Ok((existing_id, existing_name, last_synced, p_count)) = row_res {
            return Ok(FeedCollisionResultDto {
                has_collision: true,
                collision_type: "SAME_SUPPLIER_DUPLICATE".to_string(),
                canonical_url: dto.canonical_url,
                url_fingerprint: dto.url_fingerprint,
                existing_feed_id: Some(existing_id),
                existing_feed_name: Some(existing_name.clone()),
                conflicting_supplier_id: Some(dto.supplier_id.clone()),
                conflicting_supplier_name: None,
                existing_products_count: Some(p_count),
                last_synced_at: last_synced,
                suggested_feed_name: existing_name.clone(),
                message_uk: format!("Цей фід уже підключений до цього постачальника під назвою «{}». Бажаєте оновити існуючий фід замість створення дубліката?", existing_name),
                message_en: format!("This feed is already connected to this supplier as «{}». Would you like to resync the existing feed instead of creating a duplicate?", existing_name),
            });
        }
    }

    // 2. Check for cross-supplier conflict (same source_url / base_url / content_hash on a DIFFERENT supplier)
    if !fp.is_empty() || !raw_source_url.is_empty() || !content_hash.is_empty() {
        let mut stmt = conn.prepare(
            "SELECT f.id, f.name, f.supplier_id, s.name, f.last_synced_at,
                    (SELECT COUNT(*) FROM local_products p WHERE p.feed_source_id = f.id)
             FROM local_feed_sources f
             LEFT JOIN local_suppliers s ON s.id = f.supplier_id
             WHERE f.supplier_id != ?1 AND (
                 (?2 != '' AND f.url_fingerprint = ?2) OR
                 (?3 != '' AND f.canonical_url = ?3) OR
                 (?4 != '' AND f.source_url = ?4) OR
                 (?5 != '' AND f.source_url LIKE ?5 || '%') OR
                 (?4 != '' AND ?4 LIKE f.source_url || '%') OR
                 (?6 != '' AND f.content_hash = ?6)
             ) LIMIT 1"
        )?;
        let row_res = stmt.query_row(params![&dto.supplier_id, &fp, &canonical, &raw_source_url, &base_url, &content_hash], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, Option<String>>(4)?,
                r.get::<_, u32>(5).unwrap_or(0),
            ))
        });

        if let Ok((existing_id, existing_name, other_sup_id, other_sup_name, last_synced, p_count)) = row_res {
            let sup_label = other_sup_name.unwrap_or_else(|| "інший постачальник".to_string());
            let is_disambiguated = candidate_name.to_lowercase() != existing_name.to_lowercase() &&
                (candidate_name.to_lowercase().contains(&sup_label.to_lowercase()) || candidate_name.contains(" ["));

            if !is_disambiguated {
                let suggested = format!("{} [{}]", existing_name, sup_label);
                return Ok(FeedCollisionResultDto {
                    has_collision: true,
                    collision_type: "CROSS_SUPPLIER_CONFLICT".to_string(),
                    canonical_url: dto.canonical_url,
                    url_fingerprint: dto.url_fingerprint,
                    existing_feed_id: Some(existing_id),
                    existing_feed_name: Some(existing_name),
                    conflicting_supplier_id: Some(other_sup_id),
                    conflicting_supplier_name: Some(sup_label.clone()),
                    existing_products_count: Some(p_count),
                    last_synced_at: last_synced,
                    suggested_feed_name: suggested,
                    message_uk: format!("Цей фід вже зареєстрований за постачальником «{}». Оберіть унікальну назву для ізольованого імпорту.", sup_label),
                    message_en: format!("This feed is already used by supplier «{}». Choose a unique name for isolated import.", sup_label),
                });
            }
        }
    }

    // 3. Check for feed name collision within the same supplier
    if !candidate_name.is_empty() {
        let name_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM local_feed_sources WHERE supplier_id = ?1 AND LOWER(TRIM(name)) = LOWER(TRIM(?2))",
            params![&dto.supplier_id, &candidate_name],
            |r| r.get(0),
        ).unwrap_or(0);

        if name_count > 0 {
            let suggested = format!("{} #{}", candidate_name, name_count + 1);
            return Ok(FeedCollisionResultDto {
                has_collision: true,
                collision_type: "NAME_COLLISION".to_string(),
                canonical_url: dto.canonical_url,
                url_fingerprint: dto.url_fingerprint,
                existing_feed_id: None,
                existing_feed_name: Some(candidate_name.clone()),
                conflicting_supplier_id: Some(dto.supplier_id.clone()),
                conflicting_supplier_name: None,
                existing_products_count: None,
                last_synced_at: None,
                suggested_feed_name: suggested,
                message_uk: format!("Фід із назвою «{}» вже існує для цього постачальника. Назву автоматично змінено для унікальності.", candidate_name),
                message_en: format!("A feed named «{}» already exists for this supplier. Name has been adjusted for uniqueness.", candidate_name),
            });
        }
    }

    // No collision detected
    Ok(FeedCollisionResultDto {
        has_collision: false,
        collision_type: "NONE".to_string(),
        canonical_url: dto.canonical_url,
        url_fingerprint: dto.url_fingerprint,
        existing_feed_id: None,
        existing_feed_name: None,
        conflicting_supplier_id: None,
        conflicting_supplier_name: None,
        existing_products_count: None,
        last_synced_at: None,
        suggested_feed_name: candidate_name,
        message_uk: "Фід унікальний. Колізій не виявлено.".to_string(),
        message_en: "Feed is unique. No collisions detected.".to_string(),
    })
}
