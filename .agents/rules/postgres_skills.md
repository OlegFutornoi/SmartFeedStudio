---
trigger: always_on
description: Mandatory PostgreSQL & Prisma database skills and checklist — applied before ANY schema, query, or migration change in SmartFeed Studio.
---

# 🐘 SmartFeed Studio — Mandatory PostgreSQL & Database Skills Policy

## Rule: Load ALL Database Skills & Update via `context7` Before ANY DB Work

The agent MUST load and apply ALL of the following skills and update official documentation via **`context7`** (`/prisma/prisma`, `/postgresql/postgresql`) and **`postgres`** MCP BEFORE making ANY change that touches the database layer — including `schema.prisma` modifications, new Prisma queries/mutations, migrations, index additions, or Prisma handler logic.

---

## Skills Required by Trigger

| Trigger                                                                                           | Required Skills                                                                                                              |
| :------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Creating or altering any `model` in `schema.prisma`                                               | `supabase-postgres-best-practices`, `prisma-cli`, `prisma-client-api`                                                        |
| Writing or modifying Prisma queries (`findMany`, `findFirst`, `create`, `upsert`, `$transaction`) | `supabase-postgres-best-practices`, `prisma-client-api`                                                                      |
| Adding indexes (`@@index`, `@@unique`) to the schema                                              | `supabase-postgres-best-practices` (rules: `schema-foreign-key-indexes`, `query-partial-indexes`, `query-composite-indexes`) |
| Schema migrations (`prisma db push`, `prisma migrate dev`)                                        | `prisma-cli`, `supabase-postgres-best-practices`                                                                             |
| Diagnosing slow queries, timeouts, or high CPU                                                    | `supabase-postgres-best-practices` (rules: `monitor-explain-analyze`, `monitor-pg-stat-statements`)                          |
| Implementing pagination in any query handler                                                      | `supabase-postgres-best-practices` (rule: `data-pagination`) — **MUST use cursor-based for high-scale feeds**                |
| Any seed or migration writing raw SQL or Prisma bulk ops                                          | `supabase-postgres-best-practices` (rule: `data-batch-inserts`, `data-upsert`)                                               |
| Code review or audit of PostgreSQL schema, JSONB, arrays, or DB constraints                       | `postgresql-code-review`, `supabase-postgres-best-practices`                                                                 |
| PostgreSQL advanced optimization, functions, triggers, or security (RLS)                          | `postgresql-code-review`, `postgresql-optimization`                                                                          |

---

## Mandatory PostgreSQL Checklist

Apply this checklist before EVERY schema or query change:

1. ✅ **FK indexes**: All FK columns have explicit `@@index([fkColumn])` — PostgreSQL does NOT auto-index FKs. Verify via:

   ```sql
   SELECT conrelid::regclass, a.attname
   FROM pg_constraint c
   JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
   WHERE c.contype = 'f'
     AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey));
   ```

2. ✅ **Snake_case identifiers**: All table/column names use `@@map("snake_case")` and `@map("column_name")` — no camelCase in PostgreSQL.

3. ✅ **Timestamptz**: All timestamps are `DateTime` in Prisma → mapped to `timestamptz` in PostgreSQL (timezone-aware). Never use `timestamp without time zone`.

4. ✅ **No OFFSET pagination**: In high-volume endpoints use cursor-based pagination (`WHERE createdAt < cursor LIMIT N`). OFFSET scans all skipped rows.

5. ✅ **No N+1 queries**: Never loop with per-item DB calls. Use `findMany({ where: { id: { in: ids } } })` or `JOIN` via `include`.

6. ✅ **Connection pooling active**: `PrismaService` uses `Pool` from `pg` via `@prisma/adapter-pg`. Never create direct connections per request.

7. ✅ **Short transactions**: `$transaction()` never wraps external HTTP calls (S3, email, webhooks). Keep transaction scope minimal.

8. ✅ **Text search index**: For `ILIKE '%term%'` search — use `GIN` index with `pg_trgm`:

   ```prisma
   @@index([email(ops: raw("gin_trgm_ops"))], type: Gin)
   @@index([fullName(ops: raw("gin_trgm_ops"))], type: Gin)
   ```

9. ✅ **Primary key ordering**: All models use time-ordered CUID IDs (`@default(cuid())`) to prevent B-tree index fragmentation at scale.

10. ✅ **Composite & Filtered indexes**:
    ```prisma
    @@index([userId, isActive])
    @@index([role])
    @@index([targetApp, isVisible, order])
    @@index([isActive, order])
    ```

---

## Verified Schema Status (Updated: 2026-08-27)

| Check                      | Status           | Implementation Details                                                    |
| :------------------------- | :--------------- | :------------------------------------------------------------------------ |
| FK indexes                 | ✅ 100% Present  | `licenses`, `org_members`, `organizations`, `snapshots`, `product_images` |
| snake_case mapping         | ✅ All tables    | `@@map()` on all models                                                   |
| Connection pooling         | ✅ Active        | `PrismaService` uses `@prisma/adapter-pg` with `Pool`                     |
| CUID PK ordering           | ✅ 100% Migrated | All models use `@default(cuid())` for ordered B-tree insertion            |
| GIN `pg_trgm` search       | ✅ 100% Active   | GIN trgm indexes on `users.email` and `users.fullName`                    |
| Role index                 | ✅ Present       | `@@index([role])` on `users` for fast stats aggregation                   |
| License composite index    | ✅ Present       | `@@index([userId, isActive])` and `@@index([isActive])` on `licenses`     |
| Navigation composite index | ✅ Present       | `@@index([targetApp, isVisible, order])` on `navigation_items`            |
| Plan composite index       | ✅ Present       | `@@index([isActive, order])` on `tariff_plans`                            |
