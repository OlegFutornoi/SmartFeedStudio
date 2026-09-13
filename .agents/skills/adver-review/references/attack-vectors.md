# 🎯 Adversarial Attack Vectors Reference Guide

Comprehensive checklist of attack vectors and failure modes to systematically probe during an adversarial review.

---

## 1. Concurrency, Race Conditions & Mutex Bypasses (TOCTOU)

### Vulnerability Patterns:

- **Balance / Quota Exhaustion Race**: Firing 10 simultaneous API calls to upload feeds or consume AI credits when only 1 credit remains.
  - _Expected Fail_: Total credits consumed exceeds quota or balance goes negative.
  - _Defense_: Database row-level locking (`SELECT ... FOR UPDATE`), distributed Redis lock, or atomic decrement `UPDATE ... SET credits = credits - 1 WHERE credits >= 1`.
- **Token Refresh Storm**: Sending 5 concurrent requests with an expired access token simultaneously triggering `/auth/refresh`.
  - _Expected Fail_: Refresh token invalidated by the first request causing subsequent 4 requests to fail with 401.
  - _Defense_: Mutex lock in API client (`isRefreshing` promise deduplication).
- **Double-Click Form Submission**: Double-clicking "Create Organization" or "Generate License" button in UI.
  - _Expected Fail_: Duplicate records created in database.

---

## 2. Authorization, Tenant Isolation & RBAC (IDOR / BOLA)

### Vulnerability Patterns:

- **Cross-Tenant Resource Access**: User in Organization A requests/modifies/deletes resources belonging to Organization B:
  - `GET /organizations/:otherOrgId/members`
  - `PATCH /catalogs/:otherCatalogId`
  - `DELETE /feeds/:otherFeedId`
  - _Expected Fail_: Endpoint returns 200/204 instead of 403 Forbidden or 404 Not Found.
- **Privilege Escalation**: Standard `USER` sending payload to update their role to `ADMIN` or `SUPER_ADMIN` in profile update.
- **License Bypass**: Calling PRO-only or ENTERPRISE-only endpoints with an expired or `FREE` license.

---

## 3. Data Integrity & Validation Fuzzing

### Vulnerability Patterns:

- **Missing `@IsOptional()` / `@IsString()`**: DTO properties without `class-validator` decorators stripped by `ValidationPipe({ whitelist: true })`.
- **Malformed & Boundary Inputs**:
  - Negative integers (`limit: -10`, `price: -100`)
  - Extremely large strings (10MB payload)
  - Zero values (`page: 0`, `pageSize: 0`)
  - SQL injection syntax strings (`' OR 1=1 --`) in search query params
  - Corrupted XML/CSV feeds: non-XML binary, missing mandatory tags, circular references.
- **Empty / Null Handling**: Calling endpoints with `null` fields that cause unhandled `TypeError: Cannot read properties of undefined (reading '...')`.

---

## 4. State Machine & Lifecycle Corruption

### Vulnerability Patterns:

- **Terminal State Transitions**: Updating a `CANCELLED` subscription or `REVOKED` license back to `ACTIVE`.
- **Partial Failure in Multi-Step Workflows**: Simulating failure halfway through a multi-step operation (e.g. S3 upload fails after DB record created).
  - _Expected Fail_: Orphaned DB records or orphaned S3 files.
  - _Defense_: DB transaction rollback and S3 compensation deletion.
- **Network Timeout & Disconnects**: Client disconnecting while backend is processing large catalog ingestion.

---

## 5. Performance, Memory Leaks & Resource Starvation

### Vulnerability Patterns:

- **Unindexed DB Queries**: Running queries on foreign keys or search fields without `@@index`.
- **N+1 Database Queries**: Query handler calling `findUnique` inside a `.map()` loop instead of `findMany({ where: { id: { in: ids } } })`.
- **Unbounded Memory Accumulation**: Ingesting 50,000 SKU feed without streaming, reading entire buffer into Node.js heap causing `JavaScript heap out of memory`.

---

## 6. Frontend UI / UX & Network Fragility

### Vulnerability Patterns:

- **Rapid Navigation / State Desync**: Navigating between tabs before previous API call resolves.
- **Missing i18n Translation Keys**: Raw translation fallback keys appearing in the UI (e.g. `users.team_error`).
- **Sticky Table Header Transparency**: Table headers rendering transparent background when scrolled (`bg-transparent` vs `bg-card`).
