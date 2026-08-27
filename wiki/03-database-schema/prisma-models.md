# 🗄 Схема Даних Prisma ORM — SmartFeed Studio

## 📌 Загальний Огляд Файлу `schema.prisma`

Файл схеми розташовано за адресою: `services/backend-api/prisma/schema.prisma`. Схема використовує провайдер `postgresql` з розширенням `pg_trgm`, генератор `@prisma/client` з прев'ю-функцією `postgresqlExtensions`, і містить 8 оптимізованих моделей та 4 перелічення (`enum`).

Всі первинні ключі стандартизовано на `cuid()` для збереження хронологічного порядку вставки та запобігання фрагментації B-tree індексів у PostgreSQL.

---

## 📋 Перелічення (Enums)

### 1. `Role`

Визначає системний рівень привілеїв користувача:

- `SUPER_ADMIN`: Повний доступ до всіх системних налаштувань, бази даних, видачі ліцензій та конфігурації планів.
- `ADMIN`: Управління користувачами, тарифами та навігацією.
- `USER`: Звичайний клієнт (селлер, менеджер інтернет-магазину).

### 2. `PlanType` (4-рівнева система)

Тип тарифного плану — **4 рівні доступу**:

| Значення     | Рівень | Ціна/міс | Опис                                                         |
| :----------- | :----: | :------: | :----------------------------------------------------------- |
| `STARTER`    |   1    |    $0    | Безкоштовний пробний план (7 днів, 500 SKU)                  |
| `GROWTH`     |   2    |   $29    | Для активних продавців (30 днів, 10K SKU, 50 AI кредитів)    |
| `PRO`        |   3    |   $79    | Для команд і агентств (30 днів, 100K SKU, 500 AI кредитів)   |
| `ENTERPRISE` |   4    |   $249   | Корпоративний (365 днів, ∞ SKU, 5000 AI кредитів, SLA 99.9%) |

> [!NOTE]
> Ієрархія рівнів використовується в `GetAccessibleNavigationHandler` для фільтрації пунктів меню: `STARTER(1) → GROWTH(2) → PRO(3) → ENTERPRISE(4)`.

### 3. `TargetApp`

Визначає, в якому додатку відображається пункт динамічної навігації:

- `DESKTOP`: Тільки в десктопному клієнті Tauri.
- `ADMIN_PORTAL`: Тільки у веб-порталі адміністратора.
- `ALL`: В усіх додатках.

### 4. `MemberRole`

Роль користувача всередині організації/команди:

- `OWNER`, `ADMIN`, `MEMBER`.

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
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  licenses     License[]
  snapshots    Snapshot[]
  images       ProductImage[]

  ownedOrganizations      Organization[]       @relation("OrganizationOwner")
  organizationMemberships OrganizationMember[]

  @@index([role])
  @@index([createdAt])
  @@index([email(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([fullName(ops: raw("gin_trgm_ops"))], type: Gin)
  @@map("users")
}
```

### 🏢 `Organization`, `OrganizationMember` & `OrganizationInvitation`

Організації для багатокористувацького командного доступу (`Multi-Tenant Organizations`) та двоканальні запрошення:

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
  invitedById    String
  invitedBy      User             @relation("UserSentInvitations", fields: [invitedById], references: [id], onDelete: Cascade)
  email          String
  role           MemberRole       @default(MEMBER)
  token          String           @unique
  status         InvitationStatus @default(PENDING)
  expiresAt      DateTime
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([organizationId])
  @@index([invitedById])
  @@index([email])
  @@index([token])
  @@index([status])
  @@map("organization_invitations")
}
```

### 💎 `TariffPlan`

Динамічний тарифний план з повним набором квот та feature flags. Параметри можна налаштовувати без перезапуску сервера через адмін-панель:

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
  maxXmlLimit         Int     @default(500)   // Max SKU count
  aiCredits           Int     @default(0)     // AI credits per month
  canCloudBackup      Boolean @default(false) // Cloud S3 backup access
  maxFeedsLimit       Int     @default(1)     // Max active feeds
  maxChannelsLimit    Int     @default(1)     // Max output channels
  syncFrequencyHours  Int     @default(0)     // 0=manual, 24=daily, 4=6x/day, 1=hourly
  maxStorageGb        Float   @default(0)     // Cloud storage GB
  maxTeamSeats        Int     @default(1)     // Team member seats
  maxSuppliersLimit   Int     @default(1)     // Connected product suppliers

  // --- Feature Flags ---
  hasApiAccess     Boolean  @default(false)  // REST API access
  hasWebhooks      Boolean  @default(false)  // Webhook push on feed update
  hasFeedDiff      Boolean  @default(false)  // Feed version comparison
  hasWhiteLabel    Boolean  @default(false)  // White-label PDF reports
  hasSso           Boolean  @default(false)  // SSO / SAML login
  hasAuditLog      Boolean  @default(false)  // Full audit trail
  hasCustomS3      Boolean  @default(false)  // Custom S3/MinIO endpoint
  hasPriorityAi    Boolean  @default(false)  // Priority AI queue
  slaUptimePercent Float?                    // null=no SLA, 99.9=Enterprise

  // --- Display Fields ---
  isPopular    Boolean   @default(false)
  isActive     Boolean   @default(true)
  order        Int       @default(0)
  durationDays Int?      @default(7)         // Subscription cycle in days
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

Ліцензійний ключ та знімок (snapshot) квот користувача на момент підписки з оптимізованими складеними індексами `[userId, isActive]`:

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

  // Quota snapshot fields
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

### 🧭 `NavigationItem`

Динамічний пункт бічного меню з фільтрацією за ролями та планами, оптимізований складеним індексом `[targetApp, isVisible, order]`:

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

### 📦 `Snapshot` & `ProductImage`

- `Snapshot`: `id String @id @default(cuid())`, `userId`, `snapshotName`, `s3Key`, `sizeBytes`, `createdAt`.
- `ProductImage`: `id String @id @default(cuid())`, `userId`, `originalUrl`, `cloudUrl`, `s3Key`, `createdAt`.
