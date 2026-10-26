---
trigger: model_decision
description: Application security, OWASP Top 10, secret masking, SSRF defense, and IPC validation invariants.
---

# Security and Hardening Invariants

## SEC-01: 4-Layer Defense-in-Depth

- Every state mutation must pass four distinct validation layers:
  - Layer 1 (DTO Boundary): Zod or `class-validator` input schemas with `whitelist: true`.
  - Layer 2 (Domain Quota): Validation of subscription limits, seat caps, SKU counts, and credit balances.
  - Layer 3 (Security & RBAC): Passport JWT guard, user role verification, and organization tenant isolation.
  - Layer 4 (Database & Concurrency): Foreign key constraints, atomic transactions, and mutex locks.
- Reason: Single-layer validation fails when attackers bypass client validations or tamper with parameter types.

## SEC-02: Zero Secret Serialization Sinks (CWE-640)

- Passwords, argon2 password hashes, private keys, JWT secrets, and payment credentials must never be included in `JSON.stringify`, Sentry error telemetry spans, or application log statements.
- Use explicit DTO transform exclusions (`@Exclude()`) or delete sensitive keys before serialization.
- Reason: Leaked secrets in centralized log aggregators or monitoring services allow unauthorized account compromise.

## SEC-03: Secret Masking on REST Endpoints

- Configuration endpoints (e.g. `GET /payments/settings`) must NEVER return merchant secret keys or payment tokens in plaintext.
- Mask values as `••••••••` or return a boolean `isConfigured: true`.
- Reason: Plaintext secret responses allow read-only dashboard operators or intercepted HTTP sessions to steal payment credentials.

## SEC-04: BOLA / IDOR Tenant Isolation

- Every database query and mutation operating on organization resources must scope by `organizationId` from the authenticated user session.
- Never trust client-supplied `organizationId` from request bodies or URL path parameters.
- Reason: Broken Object Level Authorization (BOLA/IDOR) allows authenticated users in tenant A to read or delete tenant B records.

## SEC-05: SSRF TOCTOU Defense

- When fetching external URLs (product feeds, webhooks), perform DNS lookup and validate that the resolved IP does not point to private/loopback ranges (RFC 1918, 127.0.0.1, 169.254.169.254).
- Pin the verified safe IP address directly in the HTTP connection to eliminate DNS rebinding attacks.
- Reason: Time-of-check to time-of-use DNS rebinding allows attackers to bypass URL checks and query cloud metadata endpoints.

## SEC-06: Tauri v2 IPC Security

- All Tauri commands in `src-tauri` must validate input arguments, prevent path traversal (`..`), and restrict OS keychain access strictly to authorized service namespaces.
- Never expose arbitrary shell command execution through Tauri IPC invoke handlers.
- Reason: Unvalidated desktop IPC commands allow malicious web views to execute local arbitrary code on the user workstation.

## SEC-07: Strict File Type & Magic Bytes Ingestion

- Feed files must strictly possess one of the allowed extensions: `.xml`, `.yml`, `.csv`, `.tsv`, `.xlsx`, `.xls`, `.txt` on both frontend dropzone and backend DTOs.
- Avatar and logo uploads must strictly possess `.jpg`, `.jpeg`, `.png`, or `.webp` extensions and verify binary magic bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `RIFF...WEBP`).
- SVG formats are strictly prohibited for user/supplier avatars due to Stored XSS vectors (`<script>`, `<svg onload>`).
- Reason: Unvalidated file uploads allow arbitrary script execution, web shells, and stored cross-site scripting attacks.

## SEC-08: Zero 0-SKU Feed Progression & Format Integrity

- Feeds containing 0 detected items (`totalDetected === 0`) or missing required catalog structures are invalid and must not be marked as successfully analyzed.
- Progression to subsequent wizard steps is strictly gated until explicit analysis is executed and yields `totalDetected > 0`.
- Format detectors must never fall back to valid XML/CSV types for arbitrary or unrecognized content.
- Reason: Permitting empty or corrupted feed progression results in broken catalog state and orphaned downstream records.

## SEC-09: Strict Public DTO Whitelisting & Zero Privilege Exposure (Mass Assignment Defense)

- Public DTOs (e.g. `RegisterDto`, public checkout, inquiry forms) must NEVER declare administrative, role, quota, or permission properties (e.g. `role?: Role`, `isAdmin`, `planType`).
- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` must reject unexpected privilege properties at the gateway with `400 Bad Request` (`["property <name> should not exist"]`).
- Never rely on service-level sanitization to silently overwrite unwhitelisted privilege fields with default values; client attacks must fail fast and be rejected at the boundary.
- Reason: Declaring privilege properties in public DTOs bypasses `forbidNonWhitelisted` validation, exposes mass assignment attack surfaces, and confuses security observability.
