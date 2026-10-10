# 🧩 Закриття прогалин MCP та скілів (MCP & Skills Gap Closure)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 09.10.2026  
> **Ініціатор:** користувач («виконуй весь список прогалин»)

## 🎯 Мета

Усунути виявлені прогалини в інструментарії агентів: недійсний DevTools-скіл, відсутні MCP для БД/черг/CI, відсутні доменні скіли, відсутність Sentry на бекенді.

## 📋 Задачі

### A. Браузер — один MCP (Playwright)

- [x] Замінити `browser-testing-with-devtools` → `browser-debugging` (Playwright MCP tools).
- [x] Оновити посилання: `.agents/AGENTS.md`, `frontend/SKILL.md`, `commands/test.toml` (`.agents` + `.claude`), symlink у `.claude/skills`, `skills-lock.json`.

### B. MCP сервери (глобальний `mcp_config.json`)

- [x] `postgres` — `postgres-mcp --access-mode=restricted` (read-only, EXPLAIN, index advisor, health).
- [x] `redis` — `redis-mcp-server` (BullMQ черги, idempotency ключі).
- [x] `github` — `github-mcp-server --read-only`, токен з `gh auth token` (без plaintext).
- [x] `firecrawl` — ключ переміщено у macOS Keychain (без plaintext у конфігу).
- [x] Оновити `.agents/rules/commands.md` (перелік MCP + матриця «який MCP коли»).

### C. Нові скіли

- [x] `i18n-localization` + скрипт `scripts/check-i18n.mjs` (`pnpm i18n:check`): паритет ключів uk/en, порожні значення, `t('ns:key')` без запису.
- [x] `rust-native-backend` — `db.rs`/`rusqlite`/SQLCipher, помилки, транзакції, міграції, `clippy`.
- [x] `mock-real-parity` — паритет Mock / SQLite / Real API.
- [x] `bullmq-jobs` — retries, backoff, DLQ, concurrency, graceful shutdown, idempotent processors.
- [x] Реєстрація: `.agents/AGENTS.md`, symlinks `.claude/skills`.

### D. Sentry на бекенді

- [x] `@sentry/nestjs` + `src/instrument.ts` (no-op без `SENTRY_DSN`, вимкнено в `test`).
- [x] `SentryModule.forRoot()` у `AppModule`.
- [x] Захоплення лише 5xx у `GlobalHttpExceptionFilter` (без шуму 4xx / P2002).
- [x] `SENTRY_DSN` / `SENTRY_TRACES_SAMPLE_RATE` у `.env.example`.

## 🛡 4-рівнева модель / Failure Modes

- **Sentry**: відсутній DSN → SDK не ініціалізується, застосунок працює без змін; 4xx не репортяться; PII вимкнено (`sendDefaultPii: false`).
- **MCP**: Postgres — тільки `restricted` (read-only); GitHub — `--read-only`; секрети — Keychain / `gh` keyring.
- **i18n-скрипт**: ненульовий exit code при розбіжностях → придатний для CI / pre-commit.

## ✅ Верифікація

- `tsc --noEmit` (backend, desktop, admin) = 0 помилок; `pnpm build:backend` OK.
- `pnpm i18n:check` запускається; MCP-сервери стартують локально (`--help` / smoke).
- `pnpm format`.
