---
trigger: always_on
description: Core architecture, tech stack, and module boundaries for SmartFeed Studio.
---

# 🚀 SmartFeed Studio — Architecture & Module Guidelines

## 📌 1. Project Mission & Tech Stack

**SmartFeed Studio** — enterprise platform for parsing, editing, and syncing XML/CSV product feeds with encrypted local SQLite and S3 cloud storage.

- **Monorepo**: Turborepo + `pnpm workspaces`
- **Backend API**: NestJS 11 CQRS + Prisma + BullMQ (Port 4000)
- **Admin Portal**: Next.js 14 App Router + Tailwind + shadcn/ui (Port 3000)
- **Desktop Client**: Tauri v2 (Rust) + React 18 + SQLCipher + Keychain (Port 1420)
- **Shared Contracts**: `@smartfeed/shared` (TypeScript DTOs, Zod, Enums)
- **Database / Infra**: PostgreSQL 16, Redis 7, MinIO S3

---

## 🏛 2. Core Architectural Separation (Native vs Cloud)

- **Desktop Client (`apps/desktop`)**:
  - Uses its **OWN local native backend** in Rust/Tauri (`src-tauri/src/db.rs`).
  - Product catalogs, parsing, feed imports, and counters are stored locally in SQLCipher SQLite.
  - Refresh tokens are stored in native OS Keychain.
  - Does NOT route local catalog operations through the NestJS API.
- **Admin Web Portal (`apps/admin-portal`)**:
  - Uses the cloud backend (`services/backend-api` NestJS + Prisma/PostgreSQL).
  - Handles accounts, subscriptions, licenses, and cloud backups.

---

## ⚙️ 3. Backend CQRS Modules (`services/backend-api`)

- **`UsersModule` (Data Layer)**:
  - Database operations for `User` entity via `PrismaService`.
  - Commands: `CreateUserCommand`. Queries: `GetUserByEmailQuery`, `GetUserByIdQuery`.
  - Zero direct knowledge of JWT or auth controllers.
- **`AuthModule` (Auth & Tokens)**:
  - Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`.
  - Communicates with `UsersModule` **strictly** via `CommandBus` & `QueryBus`.
- **`PlansModule`**: Tariff plan CRUD (`/plans`), quotas, pricing.
- **`LicensesModule`**: Listens to `UserCreatedEvent` on `EventBus` to auto-provision `FREE` license keys.
- **`StorageModule`**: Issues direct S3 PUT URLs via `@aws-sdk/s3-request-presigner`.

---

## 🗄 4. Database Entities Overview

- **`User`**: Account credentials, roles (`SUPER_ADMIN`, `ADMIN`, `USER`).
- **`TariffPlan`**: Quotas, pricing, features (`featuresUk`, `featuresEn`).
- **`License`**: Key, plan type (`FREE`, `PRO`, `ENTERPRISE`), limits, expiration.
- **`Snapshot` & `ProductImage`**: S3 keys, catalog snapshots, and image media.
- **`NavigationItem`**: App navigation items, RBAC roles, target app.

---

## 📦 5. Shared Contracts (`packages/shared`)

- Place all shared DTOs, Zod schemas, and enums in `@smartfeed/shared`.
- Always run `pnpm build:shared` after modifying contracts.

---

---

## 🔄 6. Mandatory Parity: Local (Browser Mock / SQLite) vs Real Backend Server

- **100% Behavioral & Data Parity**:
  - Код клієнтів (`apps/desktop`, `apps/admin-portal`) ЗОБОВ'ЯЗАНИЙ поводитися, гідратувати зв'язки та повертати дані **абсолютно ідентично** як у локальному браузерному/mock режимі, так і при роботі з реальним сервером чи SQLite.
  - Категорично заборонено залишати розрив у логіці: якщо на реальному бекенді сутність має зв'язані поля (`supplierName`, `categories`, `activeFeedsCount`), локальний драйвер (`mockDatabaseDriver` та `LocalProductsService`) **ЗОБОВ'ЯЗАНИЙ гідратувати ці самі дані**, а не рендерити назви колонок чи технічні заглушки.
  - Всі бізнес-правила, каскадні видалення, перерахунки квот та валідації повинні синхронно працювати в обох середовищах.

---

## 🐘 7. Upfront Backend Architecture & Zero Orphaned Data Policy (Каскадність та аналіз усіх кейсів)

- **Глибокий аналіз життєвого циклу ДО написання коду**:
  - При проектуванні бекенду, контролерів, міграцій чи SQLite таблиць розробник **ЗОБОВ'ЯЗАНИЙ проаналізувати всі кейси життєвого циклу (happy path + edge cases + deletions)**, а не лише створення чи оновлення.
- **Залізне правило каскадного видалення (Zero Orphaned Records)**:
  - Видалення батьківської сутності (наприклад, фід постачальника, постачальник, категорія, організація) **ЗОБОВ'ЯЗАНЕ каскадно видаляти всі дочірні сутності** (товари цього фіду, зображення товарів, локальні файли, прив'язані правила).
  - Заборонено залишати в базі «підвішені» товари без фіда чи постачальника. Якщо видаляється фід — усі імпортовані товари цього фіду вилучаються автоматично (`ON DELETE CASCADE` + сервісна логіка очищення).
  - Лічильники (`products_count`, `feeds_count`, квоти ліцензій) при видаленні повинні атомарно зменшуватися.

---

## 🚫 8. Mandatory 100% Path Aliases (@/) & Zero Relative Imports (../)

- **Залізне правило імпортів**:
  - У всіх пакетах монорепозиторію (`apps/desktop`, `apps/admin-portal`, `services/backend-api`) **КАТЕГОРИЧНО ЗАБОРОНЕНО** використовувати відносні імпорти вгору (`../`, `../../`, `../../../`) та відносні імпорти між каталогами (`./`).
  - **Тільки префікс `@/`**: Усі внутрішні імпорти файлів проекту **ЗОБОВ'ЯЗАНІ** використовувати path alias `@/` (наприклад, `@/components/...`, `@/lib/...`, `@/services/...`, `@/modules/...`, `@/prisma/...`).
  - **Міжпакетні контракти**: Імпортуються виключно через `@smartfeed/shared`.
  - Порушення цього правила (навіть один `../`) вважається **грубим архітектурним браком** і блокує рев'ю та здачу задачі.

---

## 💬 9. Communication Policy, Zero Plan Dumping & Upfront Research (Strict)

- **Concise & Direct (Token Economy)**: Always answer user questions briefly, clearly, and to the point.
- **Zero Plan & File Dumping in Chat**: КАТЕГОРИЧНО ЗАБОРОНЕНО переписувати чи цитувати повний вміст планів та файлів у повідомленнях чату. Увесь детальний зміст плану пишеться ВИКЛЮЧНО в `plans/active/<feature>.md`, а код — у файли проєкту. У чаті надається виключно стисле резюме (1–2 речення) з клікабельними лінками (`file:///...`).
- **Reliability & Quality > "Working is Enough"**: Код пишеться не за принципом "аби працювало", а шляхом аналізу та вибору найбільш ефективного, надійного та масштабованого способу.
- **Upfront Research via `context7` & MCPs**: Перед проектуванням оновлювати знання через `context7` (`resolve-library-id`, `query-docs`) та профільні MCP.
- **Детальний регламент**: див. [communication_and_research.md](communication_and_research.md).
