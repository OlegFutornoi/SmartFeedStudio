---
name: prisma-postgres-mastery
description: Prisma ORM and PostgreSQL 16 schema design, migrations, indexing, pooling, and query patterns. Use when modifying schema.prisma, writing queries, planning expand/contract migrations, or optimizing database operations.
rules:
  - core
  - database
  - backend
---

# Prisma Postgres Mastery

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/database.md`, and `.agents/rules/backend.md`.
2. Note all invariant IDs relevant to the task in working notes (DB-01 through DB-10).
3. If touching Prisma or PostgreSQL features, call context7: `resolve-library-id {libraryName: "prisma", query: "..."}` and `query-docs`.
4. Do not write or edit schema or query code until steps 1-3 are complete.

## Schema design invariants

1. Foreign key indexes: Add an explicit `@@index([fkField])` for every relation foreign key column. PostgreSQL does not index foreign keys automatically.
2. Identifier mapping: Every model must declare `@@map("snake_case_table")` and columns must use `@map("snake_case_column")`. Never use camelCase identifiers in PostgreSQL.
3. Primary keys: Use `@id @default(cuid())` for ordered B-tree insertion without index fragmentation.
4. Timestamps: All datetime fields must be Prisma `DateTime` mapped to PostgreSQL `timestamptz(6)` via `@db.Timestamptz(6)` with `@default(now())`.
5. Composite indexes: Align index column order with query filters, for example `@@index([userId, isActive])`.
6. Cascade deletions: Declare `onDelete: Cascade` on parent-child relations to prevent orphan records.

## Connection pooling and transactions

1. Pool configuration: Connect via `pg.Pool` with `@prisma/adapter-pg`. Do not create direct unbounded connections.
2. Short transactions: Keep `$transaction()` strictly bounded to database operations. Never wrap HTTP calls, S3 presigned URL generation, emails, or queue pushes inside transactions.
3. Lock ordering: Sort resource IDs before acquiring transactional row locks to prevent deadlocks.

## Query patterns

1. Zero N+1 queries: Use batch queries `findMany({ where: { id: { in: ids } } })` or relation `include`/`select`. Never execute Prisma queries inside `.map()` or `forEach`.
2. Cursor pagination: High-volume endpoints must use cursor pagination (`take`, `skip: cursor ? 1 : 0`, `cursor: { id }`). OFFSET pagination is forbidden on large datasets.
3. Type safety: Use generated Prisma input types such as `Prisma.UserWhereInput`. Do not cast `where` or `data` objects with `as any`.

## Expand and contract migration workflow

1. Phase 1 (Expand): Add new column or table as nullable or with a default. Deploy application writing to both old and new columns.
2. Phase 2 (Backfill): Backfill existing rows in small cursor-paginated chunks. Create indexes concurrently with `SET lock_timeout = '2s'`.
3. Phase 3 (Contract): Switch application reads to the new column, remove fallback code, and drop obsolete columns safely.
