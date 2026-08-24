# SmartFeed Studio Monorepo

Enterprise-grade architecture for **SmartFeed Studio** built with `pnpm workspaces`, NestJS CQRS, Prisma ORM, BullMQ, Next.js 14 Admin Portal, and Tauri v2 (Rust) Desktop Client with encrypted SQLite & OS Keychain support.

---

## 🏛 Architecture Overview

```mermaid
graph TD
  subgraph "Desktop Client (apps/desktop)"
    Tauri[Tauri v2 + Rust Core]
    SQLite[(SQLCipher Local DB)]
    Keychain[OS Keychain]
    ReactDesktop[React + Vite UI]
    Tauri --> SQLite
    Tauri --> Keychain
    ReactDesktop --> Tauri
  end

  subgraph "Web Admin Portal (apps/admin-portal)"
    NextApp[Next.js 14 App Router]
    TailwindUI[Tailwind CSS + shadcn/ui]
    NextApp --> TailwindUI
  end

  subgraph "Backend API (services/backend-api)"
    AuthMod["AuthModule (JWT / Tokens / Passport)"]
    UsersMod["UsersModule (Prisma Data Layer)"]
    PlansMod["PlansModule (Dynamic Tariff Plans)"]
    LicMod["LicensesModule (Plan Quotas)"]
    NavMod["NavigationModule (Access Control)"]
    StorageMod["StorageModule (S3 Presigned URLs)"]
    CommandBus((CommandBus))
    QueryBus((QueryBus))
    EventBus((EventBus))

    AuthMod -- "CreateUserCommand" --> CommandBus --> UsersMod
    AuthMod -- "GetUserByEmailQuery" --> QueryBus --> UsersMod
    UsersMod -- "UserCreatedEvent" --> EventBus --> LicMod
  end

  subgraph "Infrastructure (Docker Compose)"
    PG[(PostgreSQL 16)]
    Redis[(Redis 7 / BullMQ)]
    MinIO[(MinIO / S3 Storage)]
  end

  ReactDesktop -- "Direct S3 Upload" --> MinIO
  ReactDesktop -- "REST API" --> AuthMod
  NextApp -- "Admin REST API" --> AuthMod
  UsersMod --> PG
  LicMod --> PG
  StorageMod --> MinIO
```

---

## 📦 Monorepo Structure

```text
.
├── apps/
│   ├── admin-portal/        # Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
│   └── desktop/             # Tauri v2 (Rust) + React + Vite + SQLCipher & Keychain
├── services/
│   └── backend-api/         # NestJS 11 + @nestjs/cqrs + Prisma + BullMQ + MinIO/S3
├── packages/
│   └── shared/              # Shared TypeScript package (Contracts, Zod DTOs, Enums)
├── .agents/
│   ├── rules/               # Architectural agent rules
│   ├── skills/              # Agent skills
│   ├── scripts/             # Lifecycle automation scripts
│   ├── hooks.json           # Agent lifecycle hooks (auto-formatting)
│   └── mcp_config.json      # Workspace MCP server integrations (Playwright)
├── .github/
│   └── workflows/           # CI/CD pipelines (ci.yml, release.yml, docker.yml)
├── docker-compose.yml       # Local infrastructure: PostgreSQL 16, Redis 7, MinIO
├── pnpm-workspace.yaml      # Monorepo workspaces definition
├── turbo.json               # Turborepo pipeline orchestration
├── eslint.config.mjs        # ESLint 9 Flat Config
├── .prettierrc              # Prettier code formatting rules
├── .lintstagedrc.json       # Pre-commit staged files hooks
└── .husky/                  # Git hooks
```

---

## 🛠 Повний довідник команд (CLI Commands Cheat Sheet)

### 1. 🐳 Інфраструктура та Docker

```bash
# Підняти всі контейнери у фоновому режимі (PostgreSQL, Redis, MinIO)
pnpm docker:up
# або: docker compose up -d

# Зупинити контейнери зі збереженням даних
pnpm docker:down
# або: docker compose down

# Переглянути логи всіх контейнерів у реальному часі
pnpm docker:logs
# або: docker compose logs -f

# Переглянути логи конкретного сервісу
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f minio

# Перевірити статус і стан здоров'я контейнерів
docker compose ps
```

---

### 2. ⚡ Розробка та запуск (Dev Servers)

```bash
# Запустити всі застосунки паралельно через Turborepo
pnpm dev

# Запустити тільки бекенд API (NestJS на http://localhost:4000)
pnpm dev:backend

# Запустити тільки веб-панель адміністратора (Next.js на http://localhost:3000)
pnpm dev:admin

# Запустити тільки фронтенд десктоп-клієнта у браузері (Vite на http://localhost:1420)
pnpm dev:desktop

# Запустити спільний пакет у режимі watch для автоматичної компіляції типів
pnpm --filter @smartfeed/shared dev
```

---

### 3. 🏗 Збірка проєктів (Build & Turborepo)

```bash
# Зібрати весь монорепозиторій через Turborepo (з кешуванням)
pnpm build

# Зібрати тільки спільний пакет типів та контрактів (@smartfeed/shared)
pnpm build:shared

# Зібрати тільки бекенд API (@smartfeed/backend-api)
pnpm build:backend

# Зібрати тільки адмін-панель Next.js (@smartfeed/admin-portal)
pnpm build:admin

# Зібрати фронтенд десктоп-клієнта (@smartfeed/desktop)
pnpm build:desktop
```

---

### 4. 🗄 База даних, Prisma ORM та візуальний перегляд (GUI)

```bash
# Згенерувати Prisma Client на основі schema.prisma
pnpm prisma:generate

# Створити та застосувати нову міграцію до БД
pnpm prisma:migrate

# Швидко синхронізувати схему з БД без створення міграцій (db push)
pnpm --filter @smartfeed/backend-api exec prisma db push

# Наповнити БД тестовими даними (Admin акаунт)
pnpm prisma:seed

# Запустити візуальну веб-панель Prisma Studio (перегляд та редагування таблиць БД)
pnpm prisma:studio
# Веб-інтерфейс доступний на: http://localhost:5555
```

#### 🔍 Параметри підключення до БД (TablePlus / DBeaver / DataGrip / pgAdmin):

- **Host**: `localhost` (або `127.0.0.1`)
- **Port**: `5432`
- **Database**: `smartfeed_db`
- **Username**: `postgres`
- **Password**: `postgrespassword`
- **Connection URI**: `postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public`

---

### 5. 🧪 E2E Тестування (Playwright)

```bash
# Запустити Playwright E2E тести бекенду (auth.e2e-spec.ts)
pnpm --filter @smartfeed/backend-api test:e2e

# Запустити Playwright E2E тести десктоп-клієнта (Headless CLI)
pnpm test:desktop
# або: pnpm --filter @smartfeed/desktop test:e2e

# Запустити тести десктоп-клієнта у відкритому вікні браузера (Headed Mode)
pnpm test:desktop:headed
# або: pnpm --filter @smartfeed/desktop test:e2e:headed

# Запустити інтерактивний Playwright UI Mode (Time-travel, Inspector, Traces)
pnpm test:desktop:ui
# або: pnpm --filter @smartfeed/desktop test:e2e:ui
```

---

### 6. 🛡 Контроль якості, лінтинг та форматування

```bash
# Запустити перевірку ESLint для всього репозиторію
pnpm lint

# Автоматично виправити помилки ESLint
pnpm lint:fix

# Перевірити відповідність коду правилам Prettier
pnpm format:check

# Автоматично відформатувати весь код за правилами .prettierrc
pnpm format

# Запустити lint-staged вручну для перевірки стейдж-файлів Git
pnpm lint-staged
```

---

### 7. 🖥 Нативний десктоп-клієнт Tauri v2 (Rust)

```bash
# Запустити нативний десктопний додаток у режимі розробки з гарячим перезавантаженням
pnpm --filter @smartfeed/desktop tauri:dev

# Зібрати фінальний нативний бінарник/інсталятор (macOS .dmg/.app, Windows .msi/.exe, Linux .deb/.AppImage)
pnpm --filter @smartfeed/desktop tauri:build
```

---

## 🌐 Таблиця доступів та портів сервісів

| Сервіс / Застосунок      | Адреса / Порт                    | Облікові дані (Default)                                              | Опис                                          |
| :----------------------- | :------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------- |
| **Backend REST API**     | `http://localhost:4000/api`      | JWT Bearer Token                                                     | Центральний REST API із CQRS                  |
| **Swagger Docs**         | `http://localhost:4000/api/docs` | —                                                                    | Інтерактивна OpenAPI документація             |
| **Next.js Admin Portal** | `http://localhost:3000`          | —                                                                    | Панель управління користувачами та ліцензіями |
| **Desktop Vite Client**  | `http://localhost:1420`          | —                                                                    | Веб-інтерфейс десктоп-клієнта                 |
| **PostgreSQL 16**        | `localhost:5432`                 | DB: `smartfeed_db`<br/>User: `postgres`<br/>Pass: `postgrespassword` | Основна реляційна база даних                  |
| **Redis 7**              | `localhost:6379`                 | Без пароля                                                           | Черги фонових задач BullMQ                    |
| **MinIO S3 API**         | `http://localhost:9000`          | Key: `minioadmin`<br/>Secret: `minioadminpassword`                   | S3-сумісне об'єктне сховище                   |
| **MinIO Web Console**    | `http://localhost:9001`          | User: `minioadmin`<br/>Pass: `minioadminpassword`                    | Веб-панель керування S3 бакетами              |

---

## 🔑 CQRS Flow Reference

1. **User Registration**:
   - Client sends `POST /api/auth/register`
   - `AuthService` dispatches `CreateUserCommand(email, password, fullName, role)` via `CommandBus`.
   - `CreateUserHandler` validates uniqueness, hashes password with bcrypt, saves to Prisma DB, and publishes `UserCreatedEvent`.
   - `LicensesModule` catches `UserCreatedEvent` on `EventBus` and auto-provisions a `FREE` license key (`SF-FREE-XXXX-XXXX-XXXX`).
   - `AuthService` returns JWT tokens (`accessToken`, `refreshToken`) + sanitized user profile.

2. **User Authentication**:
   - Client sends `POST /api/auth/login`
   - `AuthService` dispatches `GetUserByEmailQuery(email)` via `QueryBus`.
   - `GetUserByEmailHandler` fetches record from DB.
   - `AuthService` verifies password hash via bcrypt and returns tokens.

3. **Direct S3 Upload**:
   - Client requests presigned URL via `POST /api/storage/presigned-url`.
   - `GeneratePresignedUploadUrlHandler` generates S3 PUT URL via `@aws-sdk/s3-request-presigner`.
   - Client uploads binary asset directly to MinIO / Cloudflare R2 without burdening the API server.

---

## 📝 Правила актуалізації документації (Documentation Maintenance Rules)

Будь-які зміни в архітектурі проєкту (нові модулі, зміна CQRS-потоків, Prisma-схеми, спільних контрактів `@smartfeed/shared`, нативних Tauri-команд, портів чи інфраструктури) **обов'язково** супроводжуються синхронним оновленням документації:

1. **Головний `README.md`**: актуалізація Mermaid-діаграм архітектури, дерева модулів, опису CQRS-потоків, таблиці портів та списку CLI команд.
2. **Глобальні правила для AI-агентів**: оновлення [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md) та [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md).
3. **Локальні інструкції модулів**:
   - [services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md) — для бекенд CQRS модулів, DTO, команд, запитів, подій та БД.
   - [apps/admin-portal/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/AGENTS.md) — для Next.js сторінок, маршрутів, shadcn/ui компонентів.
   - [apps/desktop/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/AGENTS.md) — для Tauri v2 Rust команд, SQLite/SQLCipher кешу та OS Keychain.
   - [packages/shared/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/packages/shared/AGENTS.md) — для спільних Zod схем, DTO, Enums та CQRS контрактів.
