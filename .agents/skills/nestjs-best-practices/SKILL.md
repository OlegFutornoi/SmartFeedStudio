---
name: nestjs-best-practices
description: NestJS 11 CQRS architecture, modularity, dependency injection, validation, and error handling. Use when creating or modifying NestJS modules, controllers, CQRS commands, queries, handlers, services, and validation pipes.
rules:
  - core
  - backend
---

# NestJS Best Practices

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/backend.md`.
2. Note all invariant IDs relevant to the task in working notes (BE-01 through BE-10).
3. If touching NestJS, class-validator, or CQRS APIs, call context7: `resolve-library-id {libraryName: "@nestjs/core", query: "..."}` and `query-docs`.
4. Do not write or edit backend code until steps 1-3 are complete.

## Architecture and CQRS modularity

1. Modularity limit: Every handler, service, and controller must stay below 250 lines. Keep command and query handlers strictly under 120-150 lines.
2. One handler per file: Each CQRS Command Handler or Query Handler must reside in its own dedicated file. Bundling multiple handlers into a single file is prohibited.
3. Decoupling: Command handlers return `{ id }` or void, never full read entities. Queries are read-only.
4. Feature modules: Organize code by domain feature, not technical layer. UsersModule must have zero knowledge of JWT tokens, Passport strategies, or auth controllers.
5. Cloud boundary: The cloud backend runs headless in Docker/Railway. Endpoints must never execute local OS workspace filesystem operations (`fs.unlinkSync`, `fs.mkdirSync`, `fs.rmSync`). Local workspaces belong strictly to Tauri v2 Rust.

## Dependency injection

1. Constructor injection: Prefer constructor injection over property injection.
2. Avoid service locator: Do not resolve dependencies dynamically via ModuleRef unless building dynamic plugin dispatchers.
3. Injection tokens: Use symbol or string injection tokens for interface-based dependencies.
4. Scope management: Keep default singleton scope for services. Use request scope only when tenant context cannot be passed through arguments.

## Controllers and validation

1. Validated DTOs: Every property in request body DTOs must have explicit `class-validator` decorators (`@IsString()`, `@IsInt()`, `@IsOptional()`, `@Type(() => Number)`).
2. Validated query params: Every `@Query()` parameter must use a validated DTO class. Raw primitive query parameters without class-validator are prohibited.
3. Global validation pipe: Ensure `ValidationPipe` runs with `whitelist: true` and `transform: true`.
4. Guard and decorator parity: Whenever `@CurrentUser()` is used in a controller handler, the route must be protected with `@UseGuards(JwtAuthGuard)` or `@UseGuards(OptionalJwtAuthGuard)` so `request.user` is hydrated.
5. Protected mutation endpoints: All POST, PUT, DELETE, and PATCH endpoints must declare `@UseGuards(JwtAuthGuard, ...)` unless explicitly decorated with `@Public()`.

## Error handling and secrets

1. Centralized exception handling: Throw NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`). Catch blocks must log structured warnings or rethrow domain exceptions. Silent empty catch blocks are prohibited.
2. Zero fallback secrets: Never use fallback strings (`|| 'default-secret'`) for JWT secrets, HMAC keys, or encryption tokens. Throw `InternalServerErrorException` immediately if environment configuration is missing.
3. Secret serialization: Never return passwords, token hashes, or merchant secret keys in controller responses.
