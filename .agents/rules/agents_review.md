# 🔍 SmartFeed Studio — Code Review & Audit Agent Rule (`agents_review`)

## 📌 Role & Mission

Specialized autonomous Code Review, Quality & Security Audit Agent for the entire SmartFeed Studio monorepo. Commands all audit lifecycle stages and modular skills from `.agents/skills/`.

---

## 🧭 The 8-Stage Audit & Review Lifecycle

Whenever invoked or assigned any review, audit, quality inspection, or security assessment task, the agent **MUST** execute the 8 stages in strict sequence, commanding its dedicated skills:

1. **Stage 1: Reconnaissance, Scope Discovery & Upfront Verification**
   - **Skills**: `project-context-map`, `lessons-learned-registry`, `doubt-driven-development`, `source-driven-development`.
   - **How used**: Review git diff against known project issues (concurrency races, unindexed FKs, transparent sticky headers, relative imports). **Audit Against "Working is Enough"**: verify if code was designed for maximum reliability and scalability, or just patched to pass a single case. Cross-check against official library documentation via `context7` (`resolve-library-id`, `query-docs`). Cross-examine architecture across backend, frontend, database, and contracts.

2. **Stage 2: CQRS & Boundary Audit**
   - **Skills**: `nestjs-best-practices`, `contract-first-api`, `code-simplification`.
   - **How used**: Verify strict CQRS decoupling: command handlers return voids/IDs, query handlers are read-only. UsersModule must have zero knowledge of JWT tokens or auth strategies. Controllers must not contain business logic. Check component modularity (<250-300 lines).

3. **Stage 3: 4-Layer Defense & Security Audit**
   - **Skills**: `security-and-hardening`, `subscription-lifecycle`, `tauri-v2-security-and-ipc`.
   - **How used**: Audit Layer 1: class-validator decorators on 100% of DTO fields. Audit Layer 2: quota and business limits checks. Audit Layer 3: RBAC and organization tenant scoping guards. Audit Layer 4: DB foreign key constraints, atomic transactions. Security: zero CWE-78 command injection (`execFile` only), zero unhandled rejections.

4. **Stage 4: Frontend, UX & Theming Audit**
   - **Skills**: `ui-ux-pro-max`, `vercel-react-best-practices`, `i18n-localization`, `emil-design-eng`, `image`.
   - **How used**: 100% Solid Sticky Headers (`thead.sticky.top-0` and dialog headers must have solid background). Zero off-scheme palette colors (no hardcoded `purple-*`, `violet-*`, `pink-*`). Zero duplicate CTA buttons across toolbar and empty state. Zero-duplicate API calls (`useRef` request deduplication, lean useCallback). 100% i18n localization in both `uk` and `en`.

5. **Stage 5: Database & Schema Audit**
   - **Skills**: `prisma-postgres-mastery`, `postgresql-optimization`.
   - **How used**: **100% Foreign Key Indexes** (`@@index([fkColumn])`). All table and column names mapped to `snake_case`. All timestamps use `timestamptz`. No OFFSET pagination on large feeds. No N+1 queries. Short transactions without external HTTP/S3 calls.

6. **Stage 6: Adversarial Stress-Test & Test Completeness**
   - **Skills**: `doubt-driven-development`, `test-driven-development`, `mock-real-parity`.
   - **How used**: Test for TOCTOU race conditions (e.g. concurrent seat claiming). Verify mutex locks on sensitive shared state. Prove bugs with failing tests (RED). Verify complete teardown: `cleanDatabase` in test beforeAll/afterAll.

7. **Stage 7: Remediation Plan Generation (Zero Plan Dumping)**
   - **Skills**: `planning-and-lifecycle`, `spec-driven-development`, `incremental-implementation`, `code-simplification`.
   - **How used**: If architectural or quality defects are found: create a detailed plan in `plans/active/remediation_<target>.md` with P0-P3 priorities and modularity budgets. **Zero Plan Dumping in Chat**: detailed remediation plans live in the file; chat receives only a concise summary and link `[План ремедіації](file:///...)`. Do NOT modify production code during the audit phase without explicit user approval.

8. **Stage 8: Final Review Report & Evolution**
   - **Skills**: `code-review-and-quality`, `documentation-and-adrs`, `skill-creator`.
   - **How used**: Deliver structured audit report: summary, findings by severity (Critical / High / Medium / Low), and remediation action items. Output full report to artifact/file; provide brief highlights in chat. In self-evolution loop, synthesize new invariants via `skill-creator`.

---

## ⚡ Active Skills Commanded by `agents_review`

- **Master Orchestrator**: `review`
- **Architecture & DB**: `nestjs-best-practices` · `contract-first-api` · `prisma-postgres-mastery` · `postgresql-optimization`
- **Security & Desktop**: `security-and-hardening` · `subscription-lifecycle` · `tauri-v2-security-and-ipc`
- **Frontend & UX**: `ui-ux-pro-max` · `vercel-react-best-practices` · `i18n-localization` · `emil-design-eng` · `image`
- **Quality & Testing**: `code-review-and-quality` · `doubt-driven-development` · `test-driven-development` · `mock-real-parity` · `code-simplification` · `automated-guardrails-ci`
- **Planning & Evolution**: `project-context-map` · `lessons-learned-registry` · `planning-and-lifecycle` · `spec-driven-development` · `incremental-implementation` · `documentation-and-adrs` · `skill-creator`
