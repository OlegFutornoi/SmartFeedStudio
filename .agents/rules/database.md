---
trigger: glob
globs: ['**/schema.prisma', '**/migrations/**', '**/*.repository.ts', '**/*handler.ts']
description: PostgreSQL 16 and Prisma ORM database engineering invariants for SmartFeed Studio.
---

# Database and Prisma Invariants

## DB-01: 100% Foreign Key Indexes

- Every foreign key column in `schema.prisma` must have an explicit `@@index([fkColumn])`.
- PostgreSQL does NOT automatically create indexes on foreign key columns.
- Reason: Unindexed foreign keys force full table sequential scans on parent deletions, joins, and cascading checks.

## DB-02: Mandatory `@db.Timestamptz(6)`

- All `DateTime` fields in `schema.prisma` must explicitly declare `@db.Timestamptz(6)`.
- Never use PostgreSQL `timestamp without time zone`.
- Reason: Non-timezone timestamps lead to silent data corruption and timezone drift when servers run across different regions.

## DB-03: 100% snake_case Database Identifiers

- Every model in `schema.prisma` must declare `@@map("snake_case_table")`.
- Every column mapping must declare `@map("snake_case_column")`.
- Reason: Unmapped camelCase identifiers require quotes in raw PostgreSQL queries and break cross-tool DB introspection.

## DB-04: CUID Primary Key Ordering

- All models must use time-ordered CUID primary keys (`@id @default(cuid())`).
- Reason: CUID identifiers provide monotonic B-tree page insertion, eliminating random page splits caused by UUIDv4.

## DB-05: Cascade Deletions (`onDelete: Cascade`)

- Every parent-child relationship in `schema.prisma` must declare `onDelete: Cascade` on the child relation.
- Deleting a supplier, feed, or organization must automatically clean up all associated products, snapshots, and images.
- Reason: Missing cascades leave orphaned rows that corrupt aggregation metrics and violate zero-orphan invariants (L-001).

## DB-06: Zero N+1 Queries

- Never execute Prisma queries inside iteration loops (`.map()`, `for`, `forEach`).
- Fetch bulk relations using `findMany({ where: { id: { in: ids } } })` or relation `include`/`select`.
- Reason: N+1 query loops exhaust the database connection pool and cause severe latency degradation under moderate load.

## DB-07: Cursor Pagination on High-Volume Feeds

- Endpoints returning product catalogs or feed items must strictly use cursor-based pagination (`take`, `skip: cursor ? 1 : 0`, `cursor: { id }`).
- `OFFSET` pagination is strictly prohibited on datasets with more than 1,000 items.
- Reason: `OFFSET N` forces PostgreSQL to scan and discard all preceding N rows, resulting in quadratic query slowdown at scale.

## DB-08: Short `$transaction()` Blocks

- Never wrap external HTTP calls, S3 presigned URL generation, emails, or BullMQ queue pushes inside Prisma transactions.
- Keep transaction scope strictly limited to fast database write operations.
- Reason: Long-running transactions hold open database locks and connection slots, leading to connection pool starvation.

## DB-09: Connection Pooling via `@prisma/adapter-pg`

- PrismaService must use a singleton connection `Pool` from `pg` via the official adapter.
- Never instantiate direct PrismaClient instances per request.
- Reason: Ad-hoc PrismaClient instances spawn uncontrolled connection threads, exhausting PostgreSQL `max_connections`.

## DB-10: GIN `pg_trgm` Indexes for Text Search

- Any `ILIKE '%term%'` text search on high-cardinality text fields (email, fullName, product title) requires a GIN trgm index.
- Declare `@@index([field(ops: raw("gin_trgm_ops"))], type: Gin)` in Prisma schema.
- Reason: B-tree indexes cannot accelerate leading-wildcard queries (`%query%`), forcing sequential scans on millions of rows.

## DB-11: Zero-Downtime Expand/Contract Migrations

- Production database schema migrations must follow the 3-phase Expand / Contract pattern.
- Always execute `SET lock_timeout = '2s'` before DDL operations.
- `prisma db push` is strictly prohibited in production environments.
- Reason: Destructive DDL migrations lock tables and cause user-facing downtime during rolling deployments.

## DB-12: Strict Prisma Types

- Always use generated Prisma types (e.g. `Prisma.UserWhereInput`, `Prisma.ProductCreateManyInput`) in services and repositories.
- Never bypass query typing with `as any`.
- Reason: Untyped Prisma queries produce silent schema mismatches and hide breaking column renames from the compiler.
