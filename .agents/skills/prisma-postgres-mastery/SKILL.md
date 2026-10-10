---
name: prisma-postgres-mastery
description: >-
  Enterprise database engineering and optimization for Prisma ORM and PostgreSQL 16.
  Consolidates schema design, migrations, indexing, and query patterns.
  Use when creating or altering models in schema.prisma, writing Prisma queries/mutations,
  adding indexes (@@index, @@unique), configuring connection pooling (@prisma/adapter-pg),
  planning zero-downtime migrations (expand/contract), eliminating N+1 queries,
  implementing cursor pagination, or diagnosing slow queries with EXPLAIN ANALYZE.
---

# 🐘 Prisma & PostgreSQL Mastery (SmartFeed Studio)

Enterprise database engineering standard for PostgreSQL 16 + Prisma ORM in NestJS CQRS and local migrations.

## 🧭 1. Mandatory Schema Invariants (Zero-Defect Checklist)

1. **100% Foreign Key Indexes**: PostgreSQL does NOT auto-index foreign keys. Every FK field MUST have an explicit `@@index([fkField])`.
2. **snake_case Database Identifiers**: All models must have `@@map("table_name")` and fields must map via `@map("column_name")`. Never leak camelCase into PostgreSQL.
3. **Time-Ordered CUID Primary Keys**: Use `@id @default(cuid())` to prevent B-tree fragmentation during high-volume feed imports.
4. **Timezone-Aware Timestamps**: All timestamps must be `DateTime` in Prisma mapped to `timestamptz` in PostgreSQL (`@default(now())`).
5. **Composite & Filtered Indexes**: Composite indexes must align with actual query filters (e.g. `@@index([userId, isActive])`, `@@index([targetApp, isVisible, order])`).

## ⚙️ 2. Connection Pooling & Transaction Safety

- **Connection Pool**: `PrismaService` strictly connects via `Pool` from `pg` with `@prisma/adapter-pg`. Direct unbounded connections are prohibited.
- **Short Transactions**: `$transaction()` must never wrap external HTTP calls, S3 uploads, or queue pushes. Keep transactional work strictly bounded to database operations.
- **Lock Deadlock Prevention**: Always sort resource IDs before acquiring transactional locks across multiple rows.

## 🚀 3. Query Optimization & Zero N+1 Patterns

- **Zero N+1 Queries**: Never loop with individual Prisma calls (`await prisma.item.findUnique(...)`). Always use batch lookups `findMany({ where: { id: { in: ids } } })` or relation eager-loading via `include`/`select`.
- **Cursor Pagination for High-Scale Endpoints**: On large feeds or product catalogs, OFFSET pagination is strictly prohibited (it scans all skipped rows). Always use cursor-based pagination:
  ```typescript
  await prisma.product.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' },
  });
  ```

## 🔄 4. Zero-Downtime Expand/Contract Migration Pattern

When altering existing schemas with high row counts:

1. **Phase 1 (Expand)**: Add the new column/table as nullable or with default. Deploy application writing to both old and new.
2. **Phase 2 (Backfill)**: Backfill data in small, cursor-paginated chunks without locking tables. Add `CREATE INDEX CONCURRENTLY` with `lock_timeout = '2s'`.
3. **Phase 3 (Contract)**: Switch application reads to the new column/table. Drop the old column/table safely.

## 📚 5. Technical References

See detailed guides in `references/`:

- `references/query-missing-indexes.md` — Foreign key and lookup indexing
- `references/data-n-plus-one.md` — Batch query patterns
- `references/conn-pooling.md` — Connection pool tuning
- `references/data-pagination.md` — Cursor vs offset benchmarks
- `references/lock-deadlock-prevention.md` — Transaction lock ordering
