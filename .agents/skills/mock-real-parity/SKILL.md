---
name: mock-real-parity
description: Enforces 100% behavioral and data parity between browser in-memory mock mode (mockDatabaseDriver), desktop native SQLite (Tauri v2), and cloud backend API (NestJS + PostgreSQL) in SmartFeed Studio. Use when designing mock drivers, implementing catalog operations, verifying relation hydration, testing cascade deletions, or aligning error responses. Do not use for general frontend styling; use frontend or ui-ux-pro-max instead.
rules: [core, frontend, backend, database]
---

# Mock ⇄ Real Tier Parity Mastery

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/frontend.md`, `.agents/rules/backend.md`, `.agents/rules/database.md`.
2. Verify invariant `FE-08`: 100% behavioral parity across mock, SQLite, and NestJS API tiers.
3. Verify invariant `DB-05`: cascade deletions must mirror across all tiers.
4. Verify invariant `TEST-03`: assert real business data, never column header placeholders.
5. Do not write or update mock drivers until steps 1-4 are verified.

## Inputs

- Entity model or DTO contract from `packages/shared`.
- Target mock driver file in `apps/desktop/src/lib/mock-*.ts`.
- Real database repository or controller.

## Procedure

1. Step 1 - Relation Hydration Synchronization: whenever a real backend entity includes hydrated relation fields (e.g. `supplierName`, `categories`, `productsCount`), update `mockDatabaseDriver` to hydrate the exact same fields. Never leave relation fields empty or populated with column names.
2. Step 2 - Cascade Deletion Mirroring: when an entity is deleted in mock mode (e.g. supplier feed), remove all child entities (products, images) and decrement quotas atomically, mirroring PostgreSQL `ON DELETE CASCADE`.
3. Step 3 - Error Code and Status Alignment: ensure business rule rejections (quota limits, duplicate SKU) return identical error structures (`statusCode`, `message`, `code`) in mock and backend responses.
4. Step 4 - Quota Recalculation: ensure quota deductions and license counts recalculate in mock driver identically to cloud subscription handlers.
5. Step 5 - Parity Test Verification: author Playwright tests asserting real hydrated values (`expect(val).not.toBe('Постачальник')`).

## Outputs

- Synchronized mock drivers in `apps/desktop/src/lib/mock-*.ts`.
- Consistent entity responses across local dev, desktop SQLite, and cloud API.

## Gate (stop condition)

- UI renders identical data structures in both mock mode and backend mode.
- Deletion in mock mode decrements product counts and quotas correctly.
- Targeted tests pass identically across environments.

## Never

- Never return raw unhydrated foreign keys in mock mode when real backend returns joined names.
- Never leak table column names as data values in mock collections (violates `TEST-03`).
- Never allow orphaned child records in mock mode upon parent deletion (violates `DB-05`).

## References

- `references/mock-architecture.md` - read for domain mock driver structure and storage seeding patterns.
