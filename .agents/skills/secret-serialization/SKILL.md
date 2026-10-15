---
name: secret-serialization
description: Audits code for credential, token, and password leaks through object serialization, JSON.stringify, logging, Sentry telemetry, and HTTP responses. Use when adding credential fields or telemetry sinks.
rules:
  - core
  - security
---

# Secret Serialization Audit

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/security.md`.
2. Note all secret masking and leak prevention invariants in working notes (SEC-01, SEC-08).
3. If reviewing serialization formats, inspect `references/` for language-specific mechanisms.
4. Do not approve code changes until serialization sinks are verified clean.

## Audit protocol and identification

1. Credential field detection: Identify fields bearing sensitive names: `secret`, `token`, `password`, `apiKey`, `accessKey`, `privateKey`, `signingKey`, `clientSecret`, `bearer`, `credential`, `cookie`, `sessionKey`, `dsn`, `connectionString`, `webhookSecret`, `hmac`, `refreshToken`.
2. Wholesale serialization sinks: Search codebase for sinks that stringify entire objects:
   - `JSON.stringify(payload)`
   - `logger.log(...)` and `this.logger.warn(...)`
   - Sentry breadcrumbs, spans, and error context (`setExtra`, `setContext`)
   - NestJS controller DTO responses
3. Field exclusion mechanisms:
   - JavaScript/TypeScript: Mark internal credentials non-enumerable via `Object.defineProperty`, use private class fields `#private`, or strip sensitive keys before serialization.
   - Response DTOs: Use `@Exclude()` with `ClassSerializerInterceptor` or map to clean response models that omit secrets.
   - REST settings responses: Ensure `merchantSecretKey` is masked (`••••••••`) or converted to a boolean flag (`isConfigured: true`).
4. Remediation requirements:
   - Never pass raw credential objects to logging or telemetry frameworks.
   - Add unit tests verifying that stringified outputs do not contain sensitive tokens.
