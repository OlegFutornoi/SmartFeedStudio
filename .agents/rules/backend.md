---
trigger: glob
globs: '{services/backend-api/**,packages/shared/**}'
description: Backend API and CQRS engineering invariants for NestJS, Prisma, BullMQ, and shared contracts.
---

# Backend Engineering Invariants

## ARCH-01: Native vs Cloud Runtime Segregation

- Cloud NestJS backend runs headless in Docker/Railway and must NEVER perform local desktop filesystem operations (`fs.unlinkSync`, `fs.mkdirSync` on client workspaces).
- Local catalogs, SQLite, and client workspace files belong 100% to Tauri v2 Rust (`src-tauri`).
- Reason: The cloud backend has no access to client desktop filesystems; invoking local filesystem APIs causes crashes in headless cloud environments.

## ARCH-02: Zero Headless Server GUI Spawns

- Cloud backend code must never invoke OS file explorers (`open`, `explorer`, `xdg-open`).
- File management and folder opening belong exclusively to desktop client IPC commands.
- Reason: Calling desktop GUI openers inside headless server containers creates hanging child processes and denial of service (CWE-400).

## ARCH-03: Shared Contracts First

- All API DTOs, Zod schemas, and domain enums must be defined in `packages/shared`.
- Run `pnpm --filter @smartfeed/shared build` after every contract modification.
- Never write ad-hoc inline interfaces or duplicate contract types across packages.
- Reason: A single source of truth eliminates type drift and compile-time mismatch between client and server.

## ARCH-04: Strict CQRS Modularity (1 File = 1 Handler)

- Each Command Handler and Query Handler must reside in its own dedicated file (<120-150 lines).
- Bundling multiple handlers into a single file is strictly prohibited. Maximum 1 `@CommandHandler` or `@QueryHandler` per file.
- Command Handlers return `{ id }` or void, never full read entities.
- Reason: Isolated handler files enforce single responsibility, prevent merge conflicts, and keep unit tests small.

## ARCH-05: UsersModule Zero JWT Awareness

- UsersModule manages database operations for the `User` entity via PrismaService.
- AuthModule manages authentication tokens, strategies, and login/register endpoints.
- AuthModule interacts with UsersModule strictly through `CommandBus` and `QueryBus`.
- Reason: Decoupling users persistence from auth logic prevents circular dependency cycles and enables independent testing.

## BE-01: 100% Validated Controller DTOs

- Every `@Body()` and `@Query()` in NestJS controllers must use a dedicated class decorated with `class-validator` decorators.
- Query parameters must use explicit transformation: `@Type(() => Number)` with `@IsInt()`, `@Min()`, `@Max()`.
- Untyped `@Body() body: unknown` or raw `@Query('key')` are strictly forbidden.
- Reason: NestJS `ValidationPipe({ whitelist: true })` strips un-decorated fields silently, causing undefined parameters.

## BE-02: 100% Protected Mutation Endpoints

- Every `POST`, `PUT`, `DELETE`, `PATCH` endpoint must declare `@UseGuards(JwtAuthGuard, ...)` unless explicitly decorated with `@Public()`.
- Sensitive operations must add `@Roles(Role.ADMIN, ...)` or organization tenant guards.
- Reason: Unprotected mutations expose sensitive state transitions to unauthenticated attackers.

## BE-03: Guard-Decorator Parity

- Whenever `@CurrentUser()` is used in a controller handler, the route must be protected by `@UseGuards(JwtAuthGuard)` or `@UseGuards(OptionalJwtAuthGuard)`.
- Reason: Without a Passport guard executing before the handler, `request.user` is never populated, returning `undefined`.

## BE-04: Zero Hardcoded Fallback Secrets (CWE-798)

- Never use string fallbacks (`|| 'default-secret'`, `?? 'key'`) for JWT secrets, webhook HMAC keys, encryption keys, or API tokens.
- Missing configuration must fail fast at application bootstrap or throw `InternalServerErrorException('Configuration for <KEY> is missing')`.
- Reason: Hardcoded fallback secrets allow attackers to forge tokens using default strings.

## BE-06: OWASP API4 Commercial Plan Upgrade Gating

- Commercial plan upgrades (price > 0) strictly require an approved `PaymentTransaction` reference or return 402 Payment Required.
- Gated sandbox simulations are strictly prohibited in production mode.
- Reason: Direct plan selection without payment validation creates critical broken business logic vulnerabilities.

## BE-07: Concurrency, Atomic Upserts & Mutex Protection

- Sensitive shared state transitions (seat allocations, credit deductions, invitation acceptance) must use mutex locks (`OrganizationMutex`) or serializable transactions.
- Settings, configurations, and 1-to-1 relation updates must strictly use atomic `prisma.<model>.upsert` instead of sequential `findFirst` + `create/update` blocks to eliminate TOCTOU unique constraint collisions (`P2002`).
- Reason: Parallel concurrent requests exploit time-of-check to time-of-use (TOCTOU) windows to exceed license quotas or trigger unique key collision crashes.

## BE-08: Non-Negotiable TDD RED -> GREEN Execution

- Backend Agent is strictly required to author or update automated Jest / Supertest E2E tests (`services/backend-api/test/*.e2e-spec.ts`) FIRST before writing or modifying any backend CQRS handlers, services, controllers, or DTOs (`TEST-06`).
- Execute the test and verify it fails with the expected domain reason (RED).
- Implement backend application code strictly until the test suite turns 100% GREEN.
- Execute `pnpm --filter @smartfeed/backend-api build` immediately after changes to guarantee `dist/` is synchronized with source code, preventing stale runtime 400 Bad Request / DTO errors.
- Reason: Writing tests after implementation causes biased assertions, and untracked DTO changes cause runtime schema validation failures.

## BE-09: Large Feed SAX Streaming Backpressure

- Feed catalogs with 100k+ SKU must use streaming SAX parsers and chunked batch writes (500-1000 items).
- Control stream flow with backpressure events (`drain`) to prevent loading entire feeds into Node.js heap.
- Reason: In-memory XML DOM parsing of 100k+ SKU catalogs causes Node.js heap exhaustion and OOM crashes.

## BE-10: BullMQ Queue Resilience

- Background jobs must declare deterministic `jobId` for worker idempotency, exponential backoff retries, and a Dead Letter Queue (DLQ).
- Reason: Non-idempotent workers process duplicate jobs on worker restarts, creating duplicate orders or emails.
