---
name: contract-first-api
description: Contract-first API engineering using shared Zod schemas, TypeScript DTOs, and enums in packages/shared. Use when defining new endpoints, altering payload shapes, or synchronizing client and server models.
rules:
  - core
  - backend
---

# Contract-First API

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/backend.md`.
2. Note all contract and typing invariants in working notes.
3. If defining complex Zod schemas, call context7: `resolve-library-id {libraryName: "zod", query: "..."}` and `query-docs`.
4. Do not write client or server code until contracts in `packages/shared` are compiled.

## Workflow instructions

1. Define shared contracts first: Create or modify Zod schemas, TypeScript interfaces, and enum types in `packages/shared/src/` before creating backend controllers or frontend UI components.
2. Build shared package: Run `pnpm --filter @smartfeed/shared build` after any contract modification. Confirm zero compilation errors.
3. Single source of truth: Import types and schemas in `services/backend-api` and frontend applications (`apps/desktop`, `apps/admin-portal`) strictly from `@smartfeed/shared`.
4. Zero inline ad-hoc types: Never declare local inline types for API requests, responses, or entity models in frontend components or backend controllers.
5. Zero type bypasses: Do not cast payloads with `as any`. Use Zod `.parse()` or `.safeParse()` for runtime payload validation.
6. Controller DTO synchronization: NestJS request DTOs and Swagger schemas must match Zod schema definitions in `@smartfeed/shared`.
7. Non-breaking evolution: When modifying existing contracts, introduce optional fields or versioned interfaces to preserve backward compatibility.
