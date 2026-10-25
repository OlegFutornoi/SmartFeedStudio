---
name: pw-schema-sync
description: Synchronize and validate API contracts, Zod schemas, and TypeScript DTOs from @smartfeed/shared or Swagger OpenAPI specifications. Use when updating API schemas, syncing contracts, or verifying client-backend type alignment.
---

# API Contract & Schema Synchronizer (`pw-schema-sync`)

Contract synchronization pipeline connecting NestJS backend DTOs, `@smartfeed/shared` Zod schemas, and `@smartfeed/e2e` test clients.

---

## 1. Single Source of Truth (`@smartfeed/shared`)

In SmartFeed Studio, API contracts and Zod schemas live in `packages/shared`:

- DTOs and Zod validation schemas: `@smartfeed/shared`
- Local DB Command map: `LocalDbCommandMap` in `@smartfeed/shared` (or `apps/desktop/src/services/local-db/client.ts`)
- Swagger OpenAPI: `http://localhost:4000/api/docs-json`

---

## 2. Synchronization Pipeline

1. Update or extend schemas in `@smartfeed/shared`.
2. Build shared contracts:
   ```bash
   pnpm --filter @smartfeed/shared build
   ```
3. Typecheck `@smartfeed/e2e` to verify contract alignment:
   ```bash
   pnpm --filter @smartfeed/e2e typecheck
   ```
