# ⚙️ Backend API — SmartFeed Studio

## 🚀 Run Tests

```bash
# Start infrastructure first (PostgreSQL + Redis + MinIO)
pnpm docker:up

# Run all E2E tests
pnpm --filter @smartfeed/backend-api test:e2e
```

---

## 📌 Overview

Central REST API for SmartFeed Studio built with **NestJS 11** + **CQRS** + **Prisma ORM** + **PostgreSQL**.

- **Base URL**: `http://localhost:4000/api`
- **Swagger Docs**: `http://localhost:4000/api/docs`

---

## 📊 E2E Test Coverage

> **Agent Rule:** Whenever a new `*.e2e-spec.ts` file is added to `services/backend-api/test/`,
> update this table and the one in [AGENTS.md](./AGENTS.md).

| Test File                                          | Endpoints Covered                                 | Tests | Status  |
| :------------------------------------------------- | :------------------------------------------------ | :---: | :-----: |
| [`test/auth.e2e-spec.ts`](./test/auth.e2e-spec.ts) | `POST /api/auth/register`, `POST /api/auth/login` |  12   | ✅ PASS |

**Total: 12 tests — 12 passing**

---

## 📡 API Endpoints

### Auth

| Method | Endpoint             | Description                                      | Auth     |
| :----- | :------------------- | :----------------------------------------------- | :------- |
| `POST` | `/api/auth/register` | Register new user → returns JWT tokens           | —        |
| `POST` | `/api/auth/login`    | Login with email + password → returns JWT tokens | —        |
| `POST` | `/api/auth/refresh`  | Refresh access token using refresh token         | —        |
| `GET`  | `/api/auth/me`       | Get current user profile                         | `Bearer` |

### Licenses

| Method | Endpoint           | Description                       | Auth     |
| :----- | :----------------- | :-------------------------------- | :------- |
| `GET`  | `/api/licenses/my` | Get current user license & quotas | `Bearer` |

### Storage

| Method | Endpoint                     | Description                      | Auth     |
| :----- | :--------------------------- | :------------------------------- | :------- |
| `POST` | `/api/storage/presigned-url` | Generate S3 presigned upload URL | `Bearer` |

---

## 🏛 CQRS Architecture

```
HTTP Request
    │
AuthController
    │
AuthService ──── CommandBus ──── CreateUserCommand ──── CreateUserHandler ──── PrismaService (write)
    │                                                                               │
    │                                                                       EventBus → UserCreatedEvent
    │                                                                               │
    │                                                                      LicensesModule (FREE license)
    │
    └──── QueryBus ──── GetUserByEmailQuery ──── GetUserByEmailHandler ──── PrismaService (read)
                   └── GetUserByIdQuery    ──── GetUserByIdHandler    ──── PrismaService (read)
```

---

## ⚡ Dev Commands

```bash
pnpm dev:backend                                          # Start API in watch mode
pnpm --filter @smartfeed/backend-api exec prisma db push  # Sync Prisma schema
pnpm prisma:seed                                          # Seed admin account
pnpm prisma:studio                                        # Open Prisma Studio GUI
```
