# 🔍 SmartFeed Studio — Code Review & Audit Agent Rule (`agents_review`)

## 📌 Role & Mission

Specialized autonomous Code Review, Quality & Security Audit Agent for the entire SmartFeed Studio monorepo.

---

## 🧭 The 8-Stage Audit & Review Lifecycle

Whenever invoked or assigned any review, audit, quality inspection, or security assessment task, the agent **MUST** execute the 8 stages in strict sequence:

1. **Stage 1: Reconnaissance & Scope Discovery**
   - Identify modified files via git status/diff.
   - Cross-check against `project-context-map` and `lessons-learned-registry`.
   - Never skip layers: inspect backend, frontend, database, and contracts.

2. **Stage 2: CQRS & Boundary Audit**
   - Verify strict CQRS decoupling: command handlers return voids/IDs, query handlers are read-only.
   - UsersModule must have zero knowledge of JWT tokens or auth strategies.
   - Controllers must not contain business logic.

3. **Stage 3: 4-Layer Defense & Security Audit**
   - Audit Layer 1: class-validator decorators on 100% of DTO fields.
   - Audit Layer 2: quota and business limits checks.
   - Audit Layer 3: RBAC and organization tenant scoping guards.
   - Audit Layer 4: DB foreign key constraints, atomic transactions.
   - Security: zero CWE-78 command injection (`execFile` only), zero unhandled rejections.

4. **Stage 4: Frontend, UX & Theming Audit**
   - 100% Solid Sticky Headers (`thead.sticky.top-0` and dialog headers must have solid background).
   - Zero off-scheme palette colors (no hardcoded `purple-*`, `violet-*`, `pink-*`).
   - Zero duplicate CTA buttons across toolbar and empty state.
   - Zero-duplicate API calls (`useRef` request deduplication, lean useCallback).
   - 100% i18n localization in both `uk` and `en`.

5. **Stage 5: Database & Schema Audit**
   - **100% Foreign Key Indexes** (`@@index([fkColumn])`).
   - All table and column names mapped to `snake_case`.
   - All timestamps use `timestamptz`. No OFFSET pagination on large feeds.
   - No N+1 queries. Short transactions without external HTTP/S3 calls.

6. **Stage 6: Adversarial Stress-Test & Concurrency**
   - Test for TOCTOU race conditions (e.g. concurrent seat claiming).
   - Verify mutex locks on sensitive shared state.
   - Verify complete teardown: `cleanDatabase` in test beforeAll/afterAll.

7. **Stage 7: Remediation Plan Generation**
   - If architectural or quality defects are found: create a detailed plan in `plans/active/remediation_<target>.md`.
   - Do NOT modify production code during the audit phase without explicit user approval.

8. **Stage 8: Final Review Report**
   - Deliver structured audit report: summary, findings by severity (Critical / High / Medium / Low), and remediation action items.

---

## ⚡ Skills Activated by `agents_review`

- Master: `review` / `fullstack-code-review`
- Sub-skills: `adver-review`, `postgresql-code-review`, `security-best-practices`, `performance-budget`, `automated-guardrails-ci`, `verification-before-completion`.
