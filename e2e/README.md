# SmartFeed Studio — End-to-End Testing Framework (`@smartfeed/e2e`)

Centralized, resilient, and isolated automated testing framework for SmartFeed Studio, partitioned into **Server** and **Local** environments.

---

## 🏗️ Architecture & Topology

```mermaid
flowchart TD
    subgraph SERVER["1. SERVER DOMAIN"]
        SB["server/backend<br/>NestJS REST API :4000/api"]
        SA["server/admin<br/>Next.js Admin Portal :3000"]
        PG[("PostgreSQL :5432<br/>smartfeed_test_db")]
        SA --> SB --> PG
    end

    subgraph LOCAL["2. LOCAL DOMAIN"]
        LB["local/backend<br/>sqlite-dev-e2e :5002<br/>POST /api/invoke"]
        LD["local/desktop<br/>Vite / React :1421"]
        SQ[("SQLite<br/>smartfeed-e2e.db")]
        LD --> LB --> SQ
        LD -. "Auth & Quota Sync" .-> SB
    end
```

### Напрямки та порти:

1. **Server / Backend (`server/backend/`)**: Інтеграційні API-тести проти NestJS API (`http://localhost:4001/api`), підключеного до тестової бази `smartfeed_test_db` (порт 5433).
2. **Server / Admin (`server/admin/`)**: Playwright UI-тести веб-порталу адміністратора (`http://localhost:3001`).
3. **Local / Backend (`local/backend/`)**: Тести локального SQLite HTTP-моста (`http://localhost:5002`), контейнер `smartfeed-sqlite-dev-e2e`.
4. **Local / Desktop (`local/desktop/`)**: Playwright UI-тести десктопного веб-клієнта у тестовому режимі (`http://127.0.0.1:1421`), підключеного до тестової SQLite на порту 5002.

---

## 🚀 Єдина команда запуску всього тестового середовища

Для запуску повного ізольованого тестового контуру (бази даних у Docker, міграції, сиди та dev-сервери) виконується **одна команда**:

```bash
# З кореня монорепозиторію:
pnpm e2e:dev

# Або безпосередньо з папки e2e/:
cd e2e && pnpm dev
```

Ця команда автоматично виконує:

1. 🧹 Звільнення ізольованих портів E2E (`1421`, `3001`, `4001`, `5002`, `5433`).
2. 🐳 Підняття необхідних Docker-контейнерів:
   - `smartfeed-postgres-e2e`: PostgreSQL 16 на порті **`5433`** (RAM `tmpfs`, `smartfeed_test_db`).
   - `smartfeed-sqlite-dev-e2e`: SQLite на порті **`5002`** (RAM `tmpfs`).
   - `smartfeed-redis`: Redis 7 на порті `6379` (ізольована **DB 1** для черг E2E).
   - `smartfeed-mailpit`: SMTP на `1025` та Web UI / REST API на **`8025`**.
   - `smartfeed-minio`: S3 на `9000/9001`.
3. 🔄 Синхронізація схем та сид:
   - `pnpm e2e:db:sync`: застосування міграцій Prisma до `5433` та сид базових тарифів (`STARTER`, `GROWTH`, `PRO`, `ENTERPRISE`) і тестового адміна (`admin@smartfeed.local` / `adminpassword`).
   - `pnpm db:local:check`: перевірка 100% паритету схем SQLite між dev (`5001`) та e2e (`5002`).
4. 🌐 Запуск трьох паралельних E2E сервісів:
   - **Backend API (E2E)** на порті **`4001`** (`http://localhost:4001/api`).
   - **Admin Portal (E2E)** на порті **`3001`** (`http://localhost:3001`).
   - **Desktop Client Vite (E2E)** на порті **`1421`** (`http://localhost:1421`).

---

### Окремі команди за потреби:

```bash
# Синхронізація схеми PostgreSQL E2E (міграції + сид)
pnpm e2e:db:sync

# Синхронізація схеми SQLite E2E
pnpm db:local:sync
pnpm db:local:check

# Запуск тільки бекенду E2E (порт 4001)
pnpm dev:backend:e2e

# Запуск тільки адмінки E2E (порт 3001)
pnpm dev:admin:e2e

# Запуск тільки десктопу E2E (порт 1421)
pnpm dev:desktop:e2e
```

---

## 🧪 Запуск автотестів

Усі команди виконуються або з кореня монорепозиторію, або з директорії `e2e/`:

```bash
# Запуск усіх напрямків
pnpm e2e

# Серверний напрямок (Backend API + Admin Portal)
pnpm e2e:server
pnpm e2e:server:backend
pnpm e2e:server:admin

# Локальний напрямок (Local SQLite + Desktop Client)
pnpm e2e:local
pnpm e2e:local:backend
pnpm e2e:local:desktop

# Візуальний режим (UI Mode)
pnpm e2e:ui

# Перегляд звіту останнього прогону
pnpm e2e:report
```

---

## 📐 Правила написання тестів та конвенції (`TEST-06`)

1. **Тільки через QA-задачі (`QA-<num>`)**: Тести пише виключно агент `@agents_qa`. Агенти `FR-` та `BE-` тестів не пишуть (`TEST-00`).
2. **Розподіл шарів**:
   - `specs/*.spec.ts`: тестові сценарії.
   - `pages/*.page.ts`: Page Object Models.
   - `components/*.component.ts`: віджети та спільні UI-елементи.
   - `clients/*.client.ts`: типізовані HTTP-клієнти API.
   - `factories/*.factory.ts`: фабрики тестових даних.
3. **Ізоляція даних (`TEST-08`)**:
   - Будь-яка створена сутність містить `runId`: `e2e.<runId>.<name>`.
   - Email створюється як `e2e.test+<timestamp>@smartfeed.local`.
   - Заборонено видаляти або змінювати тестові акаунти розробника (`qatest@gmail.com`, `shoplinkerxml@gmail.com`).
4. **Стійкість локаторів (`TEST-09`)**:
   - Використовувати `getByTestId(...)` або `getByRole(...)`.
   - Заборонено `waitForTimeout` — використовувати `expect(...).toBeVisible()`.

---

## 📋 Автономний цикл задач тестування (`e2e/tasks/`)

Усі задачі автотестування ведуться автономно в папці `e2e/tasks/`:

- **Активні:** `e2e/tasks/active/qa-fe-<номер>-<назва>.md` (UI/Frontend) або `qa-be-<номер>-<назва>.md` (API/Backend).
- **Виконані:** `e2e/tasks/completed/`.
- **Реєстр:** [README.md](file://e2e/tasks/README.md).
- **Керування задачами через CLI:**
  ```bash
  node .agents/skills/test-author/scripts/plan-manager.js create <slug> <title> <direction>
  node .agents/skills/test-author/scripts/plan-manager.js close <slug> [summary]
  node .agents/skills/test-author/scripts/plan-manager.js list
  ```

---

## 📊 Матриця покриття автотестами (Coverage Matrix)

| Домен              | Шлях до спеків              | Кількість тестів |        Статус        |
| :----------------- | :-------------------------- | :--------------: | :------------------: |
| **Server Backend** | `e2e/server/backend/specs/` |        0         | ⏳ Очікує наповнення |
| **Server Admin**   | `e2e/server/admin/specs/`   |        0         | ⏳ Очікує наповнення |
| **Local Backend**  | `e2e/local/backend/specs/`  |        0         | ⏳ Очікує наповнення |
| **Local Desktop**  | `e2e/local/desktop/specs/`  |        0         | ⏳ Очікує наповнення |
