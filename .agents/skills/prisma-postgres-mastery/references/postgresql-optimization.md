---
name: postgresql-optimization
description: PostgreSQL 16 advanced query optimization, EXPLAIN ANALYZE diagnosis, GIN pg_trgm text search indexing, JSONB performance, and cursor pagination in SmartFeed Studio. Use when diagnosing slow SQL queries, optimizing high-volume product lookups, adding GIN indexes for ILIKE search, or replacing OFFSET pagination. Do not use for frontend components or raw schema migrations; use prisma-postgres-mastery instead.
rules: [core, database, backend]
---

# PostgreSQL Query Optimization & Indexing

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/database.md`, `.agents/rules/backend.md`.
2. Verify invariant `DB-07`: cursor pagination mandatory for catalogs; OFFSET prohibited.
3. Verify invariant `DB-10`: GIN `pg_trgm` indexes required for `ILIKE '%term%'` queries.
4. Verify invariant `DB-08`: `$transaction()` must never wrap external HTTP or queue calls.
5. Do not write or modify database queries until steps 1-4 are verified.

## Inputs

- Slow SQL query or Prisma query requiring optimization.
- Query execution plan from `EXPLAIN (ANALYZE, BUFFERS)`.

## Procedure

1. Step 1 - Query Plan Diagnosis: inspect the execution plan using the `postgres` MCP server or psql: `EXPLAIN (ANALYZE, BUFFERS) <query>`. Look for `Seq Scan`, high `Buffers: shared hit/read`, or hash joins on large unindexed tables.
2. Step 2 - Text Search Optimization: replace slow `ILIKE '%term%'` sequential scans with GIN pg_trgm indexes (`DB-10`). Ensure the `pg_trgm` extension is enabled.
3. Step 3 - JSONB Indexing: for queries filtering inside JSONB attributes (e.g. product attributes, feed metadata), add a GIN index on the JSONB column. Use containment operators (`@>`) instead of runtime text extraction.
4. Step 4 - Implement Cursor Pagination: replace `skip/take` OFFSET pagination with monotonic cursor filters: `where: { createdAt: { lt: cursorDate } }, take: pageSize, orderBy: { createdAt: 'desc' }`.
5. Step 5 - Transaction Shrinking: inspect `$transaction()` blocks. Move any S3 presigned URL generation, external API calls, or email queueing outside the transaction block (`DB-08`).

## Outputs

- Optimized Prisma queries or PostgreSQL indexes.
- Improved query execution plan with index scans instead of sequential scans.

## Gate (stop condition)

- `EXPLAIN ANALYZE` confirms Index Scan / Bitmap Index Scan on target filters.
- Query execution time p95 is under 50ms on 100k+ SKU datasets.
- Zero sequential scans on filtered high-cardinality columns.

## Never

- Never use `OFFSET` pagination on tables with >1,000 items (violates `DB-07`).
- Never perform `ILIKE '%query%'` on large tables without a GIN trgm index (violates `DB-10`).
- Never wrap long-running external operations inside `$transaction()` (violates `DB-08`).

## References

- `references/query-plans.md` - read for GIN, pg_trgm, and cursor pagination SQL examples.
