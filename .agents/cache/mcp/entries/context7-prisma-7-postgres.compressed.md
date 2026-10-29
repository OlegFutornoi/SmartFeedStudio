# Prisma 7 & PostgreSQL 16 Reference (/websites/prisma_io)

1. Connection Pooling (`@prisma/adapter-pg`):
   - Use singleton `pg.Pool` passed to `new PrismaPg(pool)`. Never fallback to hardcoded credentials; fail fast if `DATABASE_URL` is missing.
2. Indexes & Timestamps:
   - Every foreign key must declare `@@index([fkColumn])`.
   - All `DateTime` fields must declare `@db.Timestamptz(6)`.
   - Text search fields (`ILIKE`) require `@@index([field(ops: raw("gin_trgm_ops"))], type: Gin)`.
3. Batch Operations & Zero N+1:
   - Never call `prisma.model.delete()` or `update()` inside a loop; use `deleteMany({ where: { id: { in: ids } } })`.
   - Keep `$transaction()` blocks strictly limited to fast DB writes; never wrap S3 or HTTP calls inside transactions.
