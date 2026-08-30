# 🗄 Схема Даних Prisma ORM — SmartFeed Studio

## 📌 Загальний Огляд Файлу `schema.prisma`

Файл схеми розташовано за адресою: `services/backend-api/prisma/schema.prisma`. Схема використовує провайдер `postgresql` з розширенням `pg_trgm`, генератор `@prisma/client` з прев'ю-функцією `postgresqlExtensions`, і містить **10 моделей чистого SaaS-ядра** та **8 перелічень (`enum`)**.

> [!NOTE]
> **Архітектурний принцип Local-First**: База даних PostgreSQL на бекенді фокусується виключно на SaaS-задачах (Auth, Організації, Команда, Тарифи, Ліцензії, Платежі, S3 Метадані та Динамічна Навігація). Важкі комерційні дані (каталоги, товари 50k–500k SKU, фотографії, парсери та канали експорту) зберігаються у зашифрованій локальній базі даних клієнта (**SQLite / SQLCipher на Rust Tauri**).

Всі первинні ключі стандартизовано на `cuid()` для збереження хронологічного порядку вставки та запобігання фрагментації B-tree індексів у PostgreSQL.

---

## 📋 Перелічення (Enums)

1. `Role`: `SUPER_ADMIN`, `ADMIN`, `USER`
2. `PlanType`: `STARTER` (1), `GROWTH` (2), `PRO` (3), `ENTERPRISE` (4)
3. `TargetApp`: `DESKTOP`, `ADMIN_PORTAL`, `ALL`
4. `MemberRole`: `OWNER`, `ADMIN`, `MEMBER`
5. `InvitationStatus`: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `REVOKED`
6. `PaymentStatus`: `PENDING`, `APPROVED`, `DECLINED`, `REFUNDED`, `EXPIRED`
7. `PaymentProvider`: `WAYFORPAY`, `STRIPE`, `MANUAL`
8. `PaymentInterval`: `MONTHLY`, `YEARLY`

---

## 🏗 Моделі Бази Даних (Models)

### 👤 `User`

Центральна сутність користувача платформи з підтримкою GIN Trigram повнотекстового пошуку за email та повним ім'ям:

```prisma
model User {
  id           String         @id @default(cuid())
  email        String         @unique
  passwordHash String
  fullName     String?
  role         Role           @default(USER)
  isActive     Boolean        @default(true) @map("is_active")
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  licenses     License[]
  snapshots    Snapshot[]
  paymentTransactions PaymentTransaction[]

  ownedOrganizations      Organization[]           @relation("OrganizationOwner")
  organizationMemberships OrganizationMember[]
  sentInvitations         OrganizationInvitation[] @relation("InvitationSender")

  @@index([role])
  @@index([role, isActive])
  @@index([createdAt])
  @@index([email(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([fullName(ops: raw("gin_trgm_ops"))], type: Gin)
  @@map("users")
}
```

### 🏢 `Organization`, `OrganizationMember` & `OrganizationInvitation`

Організації для багатокористувацького командного доступу (`Multi-Tenant Organizations`), командні місця та запрошення по email / токенах:

```prisma
model Organization {
  id          String                   @id @default(cuid())
  name        String
  slug        String?                  @unique
  ownerId     String
  owner       User                     @relation("OrganizationOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     OrganizationMember[]
  invitations OrganizationInvitation[]
  licenses    License[]
  createdAt   DateTime                 @default(now())
  updatedAt   DateTime                 @updatedAt

  @@index([ownerId])
  @@index([createdAt])
  @@map("organizations")
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           MemberRole   @default(MEMBER)
  joinedAt       DateTime     @default(now())

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
  @@index([joinedAt])
  @@map("organization_members")
}

model OrganizationInvitation {
  id             String           @id @default(cuid())
  organizationId String
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  email          String
  role           MemberRole       @default(MEMBER)
  token          String           @unique
  status         InvitationStatus @default(PENDING)
  invitedById    String
  invitedBy      User             @relation("InvitationSender", fields: [invitedById], references: [id], onDelete: Cascade)
  expiresAt      DateTime
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([organizationId])
  @@index([invitedById])
  @@index([email])
  @@index([token])
  @@index([status])
  @@index([expiresAt])
  @@map("organization_invitations")
}
```

### 💎 `TariffPlan`

Динамічний тарифний план з повним набором квот та feature flags:

```prisma
model TariffPlan {
  id            String    @id @default(cuid())
  code          String    @unique
  nameUk        String
  nameEn        String
  descriptionUk String?
  descriptionEn String?
  priceMonthly  Decimal   @default(0) @db.Decimal(10, 2)
  priceYearly   Decimal?  @db.Decimal(10, 2)
  currency      String    @default("USD")

  // --- Quota Fields ---
  maxXmlLimit         Int     @default(500)
  aiCredits           Int     @default(0)
  canCloudBackup      Boolean @default(false)
  maxFeedsLimit       Int     @default(1)
  maxChannelsLimit    Int     @default(1)
  syncFrequencyHours  Int     @default(0)
  maxStorageGb        Float   @default(0)
  maxTeamSeats        Int     @default(1)
  maxSuppliersLimit   Int     @default(1)

  // --- Feature Flags ---
  hasApiAccess     Boolean  @default(false)
  hasWebhooks      Boolean  @default(false)
  hasFeedDiff      Boolean  @default(false)
  hasWhiteLabel    Boolean  @default(false)
  hasSso           Boolean  @default(false)
  hasAuditLog      Boolean  @default(false)
  hasCustomS3      Boolean  @default(false)
  hasPriorityAi    Boolean  @default(false)
  slaUptimePercent Float?

  isPopular    Boolean   @default(false)
  isActive     Boolean   @default(true)
  order        Int       @default(0)
  durationDays Int?      @default(7)
  featuresUk   String[]  @default([])
  featuresEn   String[]  @default([])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  licenses     License[]

  @@index([isActive, order])
  @@index([createdAt])
  @@map("tariff_plans")
}
```

### 🔑 `License`

Ліцензійні ключі користувачів та організацій із датою завершення та знімком квот:

```prisma
model License {
  id             String      @id @default(cuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  tariffPlanId   String?
  tariffPlan     TariffPlan? @relation(fields: [tariffPlanId], references: [id], onDelete: SetNull)
  licenseKey     String      @unique
  planType       PlanType    @default(STARTER)
  canCloudBackup Boolean     @default(false)
  maxXmlLimit    Int         @default(500)
  aiCredits      Int         @default(0)
  isActive       Boolean     @default(true)
  expiresAt      DateTime?

  maxFeedsLimit      Int     @default(1)
  maxChannelsLimit   Int     @default(1)
  maxTeamSeats       Int     @default(1)
  maxSuppliersLimit  Int     @default(1)
  hasApiAccess       Boolean @default(false)
  hasFeedDiff        Boolean @default(false)
  hasWhiteLabel      Boolean @default(false)
  hasSso             Boolean @default(false)
  hasAuditLog        Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, isActive])
  @@index([tariffPlanId])
  @@index([organizationId])
  @@index([isActive])
  @@index([createdAt])
  @@map("licenses")
}
```

### 💳 `PaymentTransaction` & `PaymentSetting`

Облік онлайн-оплат (WayForPay, Stripe) та конфігурація платіжних шлюзів:

```prisma
model PaymentTransaction {
  id                String          @id @default(cuid())
  orderReference    String          @unique @map("order_reference")
  userId            String          @map("user_id")
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  planCode          String          @map("plan_code")
  billingInterval   PaymentInterval @default(MONTHLY) @map("billing_interval")
  amount            Decimal         @db.Decimal(10, 2)
  currency          String          @default("UAH")
  status            PaymentStatus   @default(PENDING)
  provider          PaymentProvider @default(WAYFORPAY)
  providerPaymentId String?         @map("provider_payment_id")
  cardPan           String?         @map("card_pan")
  cardType          String?         @map("card_type")
  issuerBank        String?         @map("issuer_bank")
  failureReason     String?         @map("failure_reason")
  paymentMethod     String?         @map("payment_method")
  signature         String?
  metadata          Json?
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")

  @@index([userId])
  @@index([status])
  @@index([provider])
  @@index([createdAt])
  @@index([orderReference])
  @@map("payment_transactions")
}

model PaymentSetting {
  id                 String          @id @default(cuid())
  provider           PaymentProvider @unique
  isEnabled          Boolean         @default(true) @map("is_enabled")
  isTestMode         Boolean         @default(true) @map("is_test_mode")
  merchantAccount    String?         @map("merchant_account")
  merchantSecretKey  String?         @map("merchant_secret_key")
  merchantDomain     String?         @map("merchant_domain")
  serviceUrl         String?         @map("service_url")
  returnUrl          String?         @map("return_url")
  createdAt          DateTime        @default(now()) @map("created_at")
  updatedAt          DateTime        @updatedAt @map("updated_at")

  @@map("payment_settings")
}
```

### 📦 `Snapshot`

Метадані зашифрованих бекапів баз даних у хмарному об'єктному сховищі S3:

```prisma
model Snapshot {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  snapshotName String
  s3Key        String
  sizeBytes    BigInt
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@map("snapshots")
}
```

### 🧭 `NavigationItem`

Динамічний пункт бічного меню сайдбару з фільтрацією за ролями та планами:

```prisma
model NavigationItem {
  id            String    @id @default(cuid())
  key           String    @unique
  labelUk       String
  labelEn       String
  path          String
  icon          String    @default("LayoutDashboard")
  order         Int       @default(0)
  isVisible     Boolean   @default(true)
  requiredRoles Role[]    @default([USER, ADMIN, SUPER_ADMIN])
  requiredPlan  PlanType?
  targetApp     TargetApp @default(DESKTOP)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([targetApp, isVisible, order])
  @@map("navigation_items")
}
```
