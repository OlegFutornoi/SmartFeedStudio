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
