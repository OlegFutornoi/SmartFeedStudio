# PostgreSQL Query Optimization & Indexing Patterns Reference

## GIN Indexing for JSONB

```sql
CREATE INDEX idx_products_metadata_gin ON products USING gin(metadata);
-- Query using JSONB containment:
SELECT * FROM products WHERE metadata @> '{"brand": "Samsung"}';
```

## GIN pg_trgm for Fast ILIKE Search

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
-- Query using ILIKE:
SELECT * FROM products WHERE title ILIKE '%laptop%';
```

## Cursor-Based Pagination vs OFFSET

```sql
-- Fast Cursor Pagination (O(1)):
SELECT id, title, created_at FROM products
WHERE created_at < '2026-10-15T12:00:00Z'
ORDER BY created_at DESC
LIMIT 50;

-- AVOID: OFFSET scans all skipped rows (O(N)):
-- SELECT * FROM products ORDER BY created_at DESC LIMIT 50 OFFSET 100000;
```
