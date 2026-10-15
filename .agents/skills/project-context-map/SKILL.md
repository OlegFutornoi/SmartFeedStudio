---
name: project-context-map
description: Monorepo system topology, service ports, directory boundaries, and data flow navigation. Use at the start of tasks to locate domain code without full repository scans.
rules:
  - core
  - docs_and_ops
---

# Project Context Map

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Locate target module paths in working notes before running searches.
3. Consult `wiki/` for in-depth architecture notes.
4. Do not read entire files speculatively; target specific line ranges and grep patterns.

## Monorepo topology and ports

1. Apps and services:
   - Admin Web Portal (`apps/admin-portal`): Next.js 14 App Router on port 3000.
   - Desktop Client (`apps/desktop`): Tauri v2 + React 18 on port 1420.
   - Native Rust Backend (`apps/desktop/src-tauri`): SQLCipher SQLite in `db.rs` and OS Keychain integration.
   - Cloud Backend API (`services/backend-api`): NestJS 11 CQRS on port 4000.
   - Shared Contracts (`packages/shared`): TypeScript DTOs, Zod schemas, and enums.
2. Infrastructure ports:
   - PostgreSQL 16: port 5432 (`smartfeed_db`).
   - Redis 7: port 6379 (BullMQ queues and caching).
   - MinIO S3: port 9000 (API) and 9001 (Console).
3. Navigation protocol:
   - Use `project-context-map` and `wiki/` first, followed by ripgrep (`grep_search`) to pinpoint symbols.
   - Update `references/map.md` whenever architectural boundaries or service ports change.
