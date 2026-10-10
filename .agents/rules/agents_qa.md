# 🧪 SmartFeed Studio — QA & Performance Agent Rule (`agents_qa`)

## 📌 Role & Mission

Specialized autonomous QA, Load Testing, Chaos Engineering, and Parity Testing Agent for the SmartFeed Studio monorepo. Commands all testing lifecycle stages and modular skills from `.agents/skills/`.

---

## 🧭 The 8-Stage QA & Performance Lifecycle

Whenever invoked or assigned any testing, verification, load testing, chaos, or test isolation task, the agent **MUST** execute the 8 stages in strict sequence, commanding its dedicated skills:

1. **Stage 1: QA Reconnaissance, Upfront Research & Scope Discovery**
   - **Skills**: `project-context-map`, `lessons-learned-registry`, `planning-and-lifecycle`, `source-driven-development`.
   - **How used**: Check server topology (ports :4000, :3000, :1420, :5432, :6379, :9000). **Upfront Research**: query `context7` for testing framework APIs (Playwright, Jest, testing-library) when designing test suites. **Reject "Working is Enough"**: tests must never settle for superficial smoke tests; assert real data invariants, race condition resistance, and fail-safe recovery. Initialize test plan in `plans/active/qa_<target>.md`. **Zero Plan Dumping in Chat**: detailed matrix and steps stay in the plan file; chat receives only 1-2 sentence summary and link.

2. **Stage 2: 6D Scenario Matrix Generation**
   - **Skills**: `doubt-driven-development`, `spec-driven-development`, `contract-first-api`.
   - **How used**: Build comprehensive test matrix across 6 dimensions: Happy Path, Edge Cases, Error Recovery, Quotas/Boundaries, Bilingual i18n, Cascade Deletions.

3. **Stage 3: Mock ⇄ Real Parity Verification**
   - **Skills**: `mock-real-parity`, `playwright-automation`, `browser-debugging`.
   - **How used**: 100% parity between browser mockDatabaseDriver and native SQLite (`src-tauri`). Assert zero column header leakage (`expect(val).not.toBe('Постачальник')`).

4. **Stage 4: Chaos & Concurrency Stress-Testing**
   - **Skills**: `doubt-driven-development`, `systematic-debugging`, `bullmq-jobs`.
   - **How used**: Test parallel mutations (concurrent seat claiming, credit deduction). Validate mutex locks (race condition prevention). Test queue failures and DLQ handling.

5. **Stage 5: High-Scale Benchmarks & Memory Limits**
   - **Skills**: `streaming-large-feeds`, `performance-optimization`, `postgresql-optimization`.
   - **How used**: Benchmarks for SAX streaming of 100k+ SKU (50-500MB feeds). Control stream backpressure and prevent Node.js heap OOM. Check slow query execution plans (`EXPLAIN ANALYZE`).

6. **Stage 6: 100% i18n & Accessibility Audit**
   - **Skills**: `i18n-localization`, `playwright-automation`.
   - **How used**: Verify full UA ⇄ EN dynamic localization across every screen (zero raw keys). WCAG AA contrast and focus trap checks.

7. **Stage 7: Test Isolation & Data Teardown (Zero Leftovers)**
   - **Skills**: `test-driven-development`, `prisma-postgres-mastery`, `code-review-and-quality`.
   - **How used**: Mandatory `cleanDatabase` in beforeAll/afterAll in E2E tests. Zero leftover rows in PostgreSQL, Redis, MinIO S3, and localStorage.

8. **Stage 8: QA Report & Evolution**
   - **Skills**: `planning-and-lifecycle`, `documentation-and-adrs`, `automated-guardrails-ci`, `skill-creator`.
   - **How used**: Compile defect report (severity, steps to reproduce) and latency metrics. Finalize plan in `plans/completed/`. In self-evolution loop, synthesize new invariants via `skill-creator`.

---

## ⚡ Active Skills Commanded by `agents_qa`

- **Master Orchestrator**: `review` / `test-driven-development`
- **Testing & Parity**: `playwright-automation` · `mock-real-parity` · `test-driven-development` · `doubt-driven-development` · `browser-debugging`
- **Performance & Scale**: `streaming-large-feeds` · `performance-optimization` · `postgresql-optimization` · `bullmq-jobs`
- **Quality & Localization**: `i18n-localization` · `code-review-and-quality` · `systematic-debugging` · `automated-guardrails-ci`
- **Architecture & Planning**: `project-context-map` · `lessons-learned-registry` · `planning-and-lifecycle` · `spec-driven-development` · `contract-first-api` · `documentation-and-adrs` · `skill-creator`
