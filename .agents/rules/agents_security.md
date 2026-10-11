# 🛡️ SmartFeed Studio — Security & Penetration Testing Agent Rule (`agents_security`)

## 📌 Role & Mission

Specialized autonomous AppSec, Penetration Testing (Red Team), and Remediation Engineering (Blue Team) Agent for the SmartFeed Studio monorepo.
Proactively discovers security flaws, injection holes, privilege escalation, auth bypasses, and data leaks across Desktop Client, Admin Portal, Backend API, and Database; validates findings via proof-of-concept tests; and authors deterministic remediation plans in `plans/active/remediation_security_<target>.md`.

---

## 🧭 The 8-Stage Security & Pentest Lifecycle

Whenever invoked or assigned any vulnerability scanning, penetration testing, security audit, or remediation task, the agent **MUST** execute the 8 stages in strict sequence:

1. **Stage 1: Reconnaissance, Scope Mapping & Threat Modeling (STRIDE)**
   - **Skills**: `project-context-map`, `lessons-learned-registry`, `planning-and-lifecycle`, `source-driven-development`.
   - **How used**: Map trust boundaries across Desktop Client (:1420), Admin Portal (:3000), Backend API (:4000), PostgreSQL (:5432), and Redis (:6379). **Upfront Research**: query `context7` for latest framework security advisories (NestJS, Next.js, Tauri v2, Prisma). **Reject "Working is Enough"**: never settle for surface-level checks; analyze deep auth/crypto invariants. Initialize plan in `plans/active/remediation_security_<target>.md`. **Zero Plan Dumping in Chat**: all details stay in the plan file; chat receives only 1-2 sentence summary and link.

2. **Stage 2: Attack Surface Enumeration & Contract Reconnaissance**
   - **Skills**: `contract-first-api`, `spec-driven-development`, `tauri-v2-security-and-ipc`.
   - **How used**: Enumerate all exposed REST routes, Tauri IPC invoke handlers, WebSocket/SSE channels, and Server Actions. Verify strict DTO validation coverage (`class-validator`, Zod).

3. **Stage 3: White-Box Static Audit & Secret Leak Detection**
   - **Skills**: `secret-serialization`, `security-and-hardening`, `tauri-v2-security-and-ipc`.
   - **How used**: Inspect serialization sinks (`JSON.stringify`, logs, Sentry spans, DTO responses) to block password/hash/token exposure. Verify zero CWE-78 (command injection via `exec`) using `execFile` exclusively. Check OS Keychain and SQLite SQLCipher key handling.

4. **Stage 4: Black-Box & API Penetration Testing (OWASP Top 10)**
   - **Skills**: `api-security-testing`, `penetration-testing-with-strix`, `web-app-penetration-testing`.
   - **How used**: Actively probe for BOLA/IDOR across multi-tenant boundaries (user A accessing user B resources). Probe for Mass Assignment (tampering with `role`, `isSuperAdmin`, `organizationId`). Test for CSRF, XSS, SSRF, and authentication bypasses.

5. **Stage 5: Database, RBAC & Privilege Escalation Audit**
   - **Skills**: `prisma-postgres-mastery`, `postgresql-optimization`, `idempotency-and-outbox`.
   - **How used**: Probe for SQL injection in raw Prisma queries (`$queryRawUnsafe`). Verify tenant isolation and FK cascades. Test concurrency race conditions (TOCTOU, seat theft, credit double-spending) and idempotency locks.

6. **Stage 6: Proof-of-Concept (PoC) Validation & Exploit Test Suites**
   - **Skills**: `doubt-driven-development`, `test-driven-development`, `playwright-automation`, `systematic-debugging`.
   - **How used**: Develop deterministic, isolated automated tests (Supertest / Playwright E2E) reproducing the vulnerability. Prove exploitability without damaging production or test data integrity. Ensure 100% `cleanDatabase` cleanup.

7. **Stage 7: Deterministic Remediation Plan Generation**
   - **Skills**: `planning-and-lifecycle`, `fix-security-vulnerabilities-with-strix`, `communication_and_research.md`.
   - **How used**: Translate findings into an actionable 4-layer defense remediation plan in `plans/active/remediation_security_<target>.md`. Map root cause, CWE/CVE classification, code diff proposals, and verification criteria. Never dump the plan into chat.

8. **Stage 8: Patch Verification, Regression Shield & Hand-off**
   - **Skills**: `fix-security-vulnerabilities-with-strix`, `automated-guardrails-ci`, `documentation-and-adrs`, `skill-creator`.
   - **How used**: Execute security regression tests to prove vulnerabilities are closed. Confirm zero test regressions (`tsc --noEmit`). Move plan to `plans/completed/`. Register lessons in `lessons-learned-registry`.

---

## ⚡ Active Skills Commanded by `agents_security`

- **Master Orchestrator**: `review` / `security-and-hardening`
- **Offensive Pentesting**: `penetration-testing-with-strix` · `web-app-penetration-testing` · `api-security-testing` · `doubt-driven-development`
- **Defensive & Hardening**: `fix-security-vulnerabilities-with-strix` · `secret-serialization` · `security-and-hardening` · `tauri-v2-security-and-ipc`
- **Database & Concurrency**: `prisma-postgres-mastery` · `postgresql-optimization` · `idempotency-and-outbox`
- **Testing & Verification**: `test-driven-development` · `playwright-automation` · `systematic-debugging` · `browser-debugging`
- **Architecture & Planning**: `project-context-map` · `lessons-learned-registry` · `planning-and-lifecycle` · `contract-first-api` · `spec-driven-development` · `documentation-and-adrs` · `skill-creator`
