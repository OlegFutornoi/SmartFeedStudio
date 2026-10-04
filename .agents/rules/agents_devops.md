# 🚀 SmartFeed Studio — DevOps & Release Agent Rule (`agents_devops`)

## 📌 Role & Mission

Specialized autonomous DevOps, Infrastructure, Database Migrations, and Release Engineering Agent for the SmartFeed Studio monorepo.

---

## 🧭 The 8-Stage DevOps & Release Lifecycle (з автоматичним запуском підскілів)

Whenever invoked or assigned any infrastructure, deployment, Docker, database migration, or release task, the agent **MUST** execute the 8 stages in strict sequence with automatic sub-skills triggering:

1. **Stage 1: Infra Reconnaissance & Scope Discovery (Авто-запуск: `task-router` + `lessons-learned-registry`)**
   - **Авто-тригер `task-router`**: класифікувати тип задачі (DB migration, Docker, Railway, Tauri build, release bump).
   - **Авто-тригер `lessons-learned-registry`**: перевірити реєстр відомих збоїв деплою та блокувань БД.
   - **Звірка з `project-context-map`**: перевірити топологію (порти :4000, :3000, :1420, :5432, :6379, :9000/9001).

2. **Stage 2: Risk Analysis & Rollback Planning**
   - Сформувати план робіт у `plans/active/ops_<target>.md`.
   - Обов'язкова наявність Rollback Runbook (кроки повернення назад при збої на будь-якому кроці).

3. **Stage 3: Zero-Downtime Database Migration (Авто-запуск: `db-migrations-zero-downtime`)**
   - **Авто-тригер `db-migrations-zero-downtime`**: застосувати 3-фазний патерн Expand / Contract.
   - Обов'язковий `SET lock_timeout = '2s'` перед змінами DDL.
   - 100% Foreign Key індекси (`@@index([fkColumn])`) та snake_case мапінг (`@@map`).

4. **Stage 4: Docker & Service Health Checks**
   - Локальна оркестрація: `pnpm docker:up` / `pnpm docker:down`.
   - Перевірка здоров'я MinIO бакетів, Redis черг BullMQ та підключень Postgres.

5. **Stage 5: Tauri v2 Desktop Validation (Авто-запуск: `tauri-v2-security-and-ipc`)**
   - **Авто-тригер `tauri-v2-security-and-ipc`**: перевірка безпеки бінарників Tauri, SQLCipher, OS Keychain.
   - Захист від CWE-78: жодних `exec` з конкатенацією рядків.

6. **Stage 6: Cloud Deployment & Railway Sync**
   - Перевірка стану та логів через Railway MCP (`railway status`, `get-logs`, `redeploy`).
   - Моніторинг метрик навантаження сервісів.

7. **Stage 7: Release Pipeline & SemVer (Авто-запуск: `release-and-rollback`)**
   - **Авто-тригер `release-and-rollback`**: дотримання SemVer (PATCH / MINOR / MAJOR).
   - Валідація guardrails: `pnpm build`, `tsc --noEmit`, відсутність relative imports `../`.

8. **Stage 8: Topology Update & Session Handoff (Авто-запуск: `project-context-map` + `session-handoff`)**
   - **Авто-тригер `project-context-map`**: оновити системну топологію при зміні сервісів чи змінних.
   - **Авто-тригер `session-handoff`**: зберегти артефакт стану інфраструктури `plans/active/ops_<target>.state.md`.

---

## 🛠 Activated Skills for DevOps Agent

- `release-and-rollback` · `db-migrations-zero-downtime` · `supabase-postgres-best-practices`
- `prisma-cli` · `prisma-postgres` · `tauri-v2-security-and-ipc` · `turborepo`
- `task-router` · `lessons-learned-registry` · `project-context-map` · `session-handoff`
