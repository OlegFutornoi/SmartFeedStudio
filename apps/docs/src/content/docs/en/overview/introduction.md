---
title: 'Introduction & Platform Overview'
description: 'High-level introduction to SmartFeed Studio — mission, core building blocks, and developer quick start'
sidebar:
  order: 1
---

Welcome to the official documentation for the **SmartFeed Studio** engineering ecosystem!

SmartFeed Studio is an enterprise-grade platform engineered for parsing, enriching, validating, and synchronizing massive product catalogs (XML/CSV) with encrypted local SQLite (SQLCipher), cloud object storage (S3 / Cloudflare R2), and a high-throughput NestJS 11 CQRS backend.

---

## 🏛 Architectural Landscape

The SmartFeed Studio ecosystem is organized as a Turborepo monorepo structured into several core packages:

1. **Desktop Client (`apps/desktop`)**:
   - Stack: Tauri v2, React 18, Tailwind CSS, shadcn/ui.
   - Database: Embedded SQLite with full-disk **SQLCipher** encryption and OS Keychain key storage.
   - Offline-First: Full capabilities for catalog exploration, supplier pricing rules, and local feed workflows without network connectivity.

2. **Backend API (`services/backend-api`)**:
   - Stack: NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis 7, BullMQ.
   - Design: Segregated CommandBus and QueryBus (1 handler per file), Transactional Outbox pattern, idempotent job queues, and strict DTO runtime validation.

3. **Admin Web Portal (`apps/admin-portal`)**:
   - Stack: Next.js 14 App Router, React Server Components.
   - Purpose: Management of tenants, commercial licenses, storage quotas, telemetry, and tariff plans.

4. **Documentation Portal (`apps/docs`)**:
   - Stack: Astro Starlight, bilingual (UA / EN) architecture, integrated Pagefind offline search.

---

## 🧭 Navigating the Documentation

- [🎯 Product Vision & Mission](/en/overview/product-vision/) — platform goals, seller pain points, and strategic roadmap.
- [🏛 High-Level System Architecture](/en/overview/architecture-high-level/) — monorepo topology, inter-service communication, and data flow.
- [📊 Technology Stack Matrix](/en/architecture/stack-matrix/) — layered overview of tools and libraries.
- [🔄 NestJS CQRS Architecture](/en/backend/cqrs-architecture/) — Command, Query, and EventBus mechanics with BullMQ queues.
- [📋 Prisma Database Schema](/en/database/prisma-models/) — PostgreSQL table layout, foreign key indexes, and cascade deletion rules.
- [🦀 Tauri v2 Desktop Architecture](/en/desktop/tauri-architecture/) — IPC command security, SQLCipher key derivation, and native Rust commands.
- [🧪 Testing Strategy & QA](/en/testing/testing-strategy/) — TDD approach, E2E test suites (Jest & Playwright), and database teardown policies.

---

## ⚡ Developer Quick Start

To run the complete local development environment:

```bash
# 1. Start background infrastructure services (Postgres, Redis, MinIO, Mailpit)
pnpm docker:up

# 2. Generate Prisma client & run database migrations
pnpm prisma:generate
pnpm prisma:migrate

# 3. Start all services concurrently
pnpm dev

# 4. Start local documentation portal
pnpm dev:docs
```

The documentation portal is available at [http://localhost:4321/en/](http://localhost:4321/en/).
