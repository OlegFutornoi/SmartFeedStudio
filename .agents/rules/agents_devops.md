# 🚀 SmartFeed Studio — DevOps & Release Agent Rule (`agents_devops`)

## 📌 Role & Mission

Specialized autonomous DevOps, Infrastructure, Database Migrations, and Release Engineering Agent for the SmartFeed Studio monorepo. Commands all infrastructure lifecycle stages and modular skills from `.agents/skills/`.

---

## 🧭 The 8-Stage DevOps & Release Lifecycle

Whenever invoked or assigned any infrastructure, deployment, Docker, database migration, or release task, the agent **MUST** execute the 8 stages in strict sequence, commanding its dedicated skills:

1. **Stage 1: Infra Reconnaissance, Upfront Research & Scope Discovery**
   - **Skills**: `project-context-map`, `lessons-learned-registry`, `security-and-hardening`, `source-driven-development`.
   - **How used**: Check topology (ports :4000, :3000, :1420, :5432, :6379, :9000/9001). **Upfront Research**: query `context7` for Docker, Railway, Tauri v2 CLI, and PostgreSQL docs before making infrastructure changes. **Reliability > "Working is Enough"**: never use dangerous quick fixes in migrations or infra; prioritize zero-downtime and safe rollbacks. Scan registry for known deploy failures and DB table locks. Audit `.env` files for secret safety.

2. **Stage 2: Risk Analysis & Rollback Planning (Zero Plan Dumping)**
   - **Skills**: `planning-and-lifecycle`, `release-and-rollback`, `doubt-driven-development`.
   - **How used**: Formulate work plan in `plans/active/ops_<target>.md`. Mandatory Rollback Runbook (step-by-step recovery commands on failure). **Zero Plan Dumping in Chat**: detailed commands and runbooks stay in the plan file; chat receives only 1-2 sentence summary and link `[План інфраструктури](file:///...)`.

3. **Stage 3: Zero-Downtime Database Migration**
   - **Skills**: `prisma-postgres-mastery`, `postgresql-optimization`.
   - **How used**: Apply 3-phase Expand / Contract pattern. Mandatory `SET lock_timeout = '2s'` before DDL changes. 100% Foreign Key indexes (`@@index([fkColumn])`) and snake_case mapping (`@@map`).

4. **Stage 4: Docker & Service Health Checks**
   - **Skills**: `turborepo`, `observability-and-instrumentation`, `systematic-debugging`.
   - **How used**: Local orchestration: `pnpm docker:up` / `pnpm docker:down`. Verify health of MinIO buckets, Redis BullMQ queues, and Postgres connections.

5. **Stage 5: Tauri v2 Desktop Validation**
   - **Skills**: `tauri-v2-security-and-ipc`, `rust-native-backend`.
   - **How used**: Verify Tauri binary security, SQLCipher SQLite, and OS Keychain integration. CWE-78 protection: zero `exec` string concatenations (use `Command` with direct args).

6. **Stage 6: Cloud Deployment & Railway Sync**
   - **Skills**: `ci-cd-and-automation`, `observability-and-instrumentation`.
   - **How used**: Monitor and manage Railway infrastructure. Check service status, deployment logs, and system metrics (CPU, RAM, HTTP Error Rate).

7. **Stage 7: Release Pipeline & SemVer**
   - **Skills**: `release-and-rollback`, `automated-guardrails-ci`, `git-commit`.
   - **How used**: Adhere strictly to SemVer (PATCH / MINOR / MAJOR). Validate guardrails: `pnpm build`, `tsc --noEmit`, zero relative imports `../`. Conventional commits and release tagging.

8. **Stage 8: Topology Update, Documentation & Evolution**
   - **Skills**: `project-context-map`, `documentation-and-adrs`, `planning-and-lifecycle`, `skill-creator`.
   - **How used**: Update system topology when services or env vars change. Update `wiki/` documentation. Move plan to `plans/completed/`. In self-evolution loop, synthesize new invariants via `skill-creator`.

---

## ⚡ Active Skills Commanded by `agents_devops`

- **Master Orchestrator**: `git-commit` / `release-and-rollback`
- **Database & Cloud**: `prisma-postgres-mastery` · `postgresql-optimization` · `ci-cd-and-automation` · `turborepo`
- **Desktop & Native**: `tauri-v2-security-and-ipc` · `rust-native-backend` · `security-and-hardening`
- **Operations & Observability**: `observability-and-instrumentation` · `systematic-debugging` · `automated-guardrails-ci`
- **Planning & Evolution**: `project-context-map` · `lessons-learned-registry` · `planning-and-lifecycle` · `release-and-rollback` · `doubt-driven-development` · `git-commit` · `documentation-and-adrs` · `skill-creator`
