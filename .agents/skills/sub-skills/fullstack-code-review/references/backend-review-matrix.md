# ⚙️ Backend & CQRS Review Matrix (`services/backend-api`)

## 1. CQRS Module Decoupling Checklist

| Check                     | Target Module    | Rule & Inspection Criteria                                                                                                                                                    |
| :------------------------ | :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Persistence Isolation** | `UsersModule`    | Contains **ONLY** DB operations via Prisma. Never import JWT, tokens, Passport, or auth controllers into `UsersModule`.                                                       |
| **Auth Decoupling**       | `AuthModule`     | Coordinates `/auth/*` endpoints. Interacts with `UsersModule` **strictly** via `CommandBus` (`CreateUserCommand`) and `QueryBus` (`GetUserByEmailQuery`, `GetUserByIdQuery`). |
| **Event-Driven Licenses** | `LicensesModule` | Listens to `UserCreatedEvent` on `EventBus` to auto-provision default `FREE` license (`SF-FREE-XXXX`). Never tightly couples to user registration code.                       |
| **Presigned URL Storage** | `StorageModule`  | Uses `@aws-sdk/s3-request-presigner` to issue direct S3 PUT URLs. Heavy files upload directly to S3 without passing through NestJS RAM.                                       |
| **Dependency Injection**  | All Modules      | All services provided as Singletons. Zero circular dependencies (verify no `forwardRef()` unless strictly unavoidable).                                                       |

---

## 2. 4-Layer Defense-in-Depth Validation

```text
[HTTP Request]
     │
     ▼
[Layer 1: DTO & Zod/ValidationPipe] ──► Strip unknown properties (`whitelist: true`), type check
     │
     ▼
[Layer 2: Domain Quota & Business Rules] ──► `isSupplierLimitReached`, `ONLY_OWNER_CAN_CHANGE_PLAN`
     │
     ▼
[Layer 3: Guards & Auth Layer] ──► `JwtAuthGuard`, `RequireActiveLicenseGuard`, `RolesGuard`
     │
     ▼
[Layer 4: Database Constraints] ──► Foreign keys, atomic transactions, unique indexes
```

### Checks:

1. **Layer 1**: Are all controller endpoints decorated with proper DTOs or Zod pipes? Is `whitelist: true` active?
2. **Layer 2**: Are plan limits and quotas checked BEFORE performing heavy database operations or job dispatch?
3. **Layer 3**: Are all sensitive routes protected with `@UseGuards(JwtAuthGuard, RolesGuard)`?
4. **Layer 4**: Are foreign key relations safeguarded with `ON DELETE CASCADE` or `ON DELETE RESTRICT` in PostgreSQL?

---

## 3. Sentry Backend Bug & Reliability Checklist

- [ ] **No Unhandled Promises**: Every async query or command handler must be caught or handled by `GlobalHttpExceptionFilter`.
- [ ] **Short DB Transactions**: Never put external HTTP requests (S3, Mailpit, Stripe/WayForPay) inside `prisma.$transaction()`.
- [ ] **XML/CSV Stream Cleanup**: Streaming parsers (`saxy`, `csv-parse`) must close file descriptors on errors or client aborts.
- [ ] **Safe Null-Coalescing**: Accessing optional relations (e.g. `user.organization?.members`, `license.tariffPlan?.maxStorageGb`) must use optional chaining `?.` with safe defaults.
- [ ] **Rate Limiting & Security**: Rate limiters configured on `/auth/login`, `/auth/register`, and password recovery endpoints.
