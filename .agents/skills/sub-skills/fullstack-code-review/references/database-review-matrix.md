# 🐘 PostgreSQL & Prisma Review Matrix (`schema.prisma` & Query Layer)

## 1. Mandatory PostgreSQL & Prisma Checklist

| Check                      | Requirement                          | Verification / Example                                                                                                       |
| :------------------------- | :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **FK Indexes**             | **100% Explicit Indexes on All FKs** | PostgreSQL does NOT auto-index foreign keys. Ensure `@@index([userId])`, `@@index([tariffPlanId])`, `@@index([supplierId])`. |
| **Snake_case Identifiers** | All tables and columns mapped        | `@@map("table_name")` on models, `@map("column_name")` on columns. No raw camelCase in DB.                                   |
| **Timestamptz**            | Timezone-aware DateTime              | All timestamps mapped to `timestamptz`. Never use `timestamp without time zone`.                                             |
| **CUID PK Ordering**       | Ordered Primary Keys                 | `@default(cuid())` to prevent B-tree index fragmentation at high insert scale.                                               |
| **No OFFSET Pagination**   | Cursor-based for Large Catalogs      | Use `WHERE createdAt < cursor LIMIT N` for feeds and product catalogs.                                                       |
| **Zero N+1 Queries**       | Batch or Include                     | Use `findMany({ where: { id: { in: ids } } })` or `include: { ... }` instead of looping DB queries.                          |
| **Text Search Indexes**    | GIN Trigram Indexes                  | `@@index([email(ops: raw("gin_trgm_ops"))], type: Gin)` for `ILIKE` searches.                                                |
| **Connection Pooling**     | Pool via Adapter                     | `PrismaService` uses `Pool` from `pg` via `@prisma/adapter-pg`.                                                              |

---

## 2. SQL Schema Integrity Verification Script

Verify all FKs have indexes:

```sql
SELECT conrelid::regclass AS table_name, a.attname AS fk_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );
```

_(Should return 0 rows)._
