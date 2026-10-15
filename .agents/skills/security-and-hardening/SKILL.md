---
name: security-and-hardening
description: Application security hardening, 4-layer defense, OWASP Top 10 mitigation, secret masking, command injection defense, and SSRF prevention. Use when implementing auth, data persistence, mutation routes, or external integrations.
rules:
  - core
  - security
---

# Security and Hardening

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/security.md`.
2. Note all security invariant IDs in working notes (SEC-01 through SEC-08).
3. If implementing cryptographic or authentication logic, query context7 for security guidelines.
4. Do not complete implementation before verifying 4-layer defense.

## Four-layer defense architecture

1. Layer 1 - DTO boundary: Validate 100% of request fields with class-validator on backend and Zod on client. Reject unwhitelisted parameters.
2. Layer 2 - Domain and quota enforcement: Check subscription plan limits, seat allocations, SKU counts, and AI credit balances before performing mutations. Direct tier upgrades to commercial plans without payment are blocked (OWASP API4).
3. Layer 3 - Security and authorization guards: Protect all mutation routes (POST, PUT, DELETE, PATCH) with `@UseGuards(JwtAuthGuard)` unless explicitly decorated with `@Public()`. When using `@CurrentUser()`, ensure guard hydration.
4. Layer 4 - Database constraints: Enforce tenant isolation (`WHERE organizationId = ...`), foreign key constraints, atomic transactions, and parameterized Prisma queries.

## Secret handling and serialization

1. Zero hardcoded fallback secrets: Never use fallback strings (`|| 'secret'`) for JWT tokens, webhook HMAC keys, or encryption secrets. Fail fast if environment variables are absent.
2. Secret masking in REST responses: Never expose `merchantSecretKey` or raw credentials in settings endpoints. Mask values (`••••••••` + last 4 characters) or return boolean flags.
3. Zero secret serialization: Exclude credentials, passwords, and tokens from `JSON.stringify`, structured loggers, Sentry spans, and DTO outputs.

## Injection and server execution safety

1. Command injection defense (CWE-78): Never execute commands via `exec` with string concatenation. Use `execFile(binary, [args], { shell: false })` with discrete argument arrays.
2. Headless server safety (CWE-400): Never invoke desktop GUI tools (`open`, `explorer`, `xdg-open`) inside cloud backend API code.
3. SSRF TOCTOU defense (CWE-918): Pin validated destination IP addresses when performing DNS lookups prior to HTTP feed fetching to prevent DNS rebinding attacks.
4. Native desktop security: Store SQLCipher database keys and refresh tokens exclusively in the host OS Keychain using the `keyring` Rust crate.
