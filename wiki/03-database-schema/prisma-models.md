# 🗄 Схема Даних Prisma ORM — SmartFeed Studio

## 📌 Загальний Огляд Файлу `schema.prisma`

Файл схеми розташовано за адресою: `services/backend-api/prisma/schema.prisma`. Схема використовує провайдер `postgresql` і містить 6 основних моделей та 3 перелічення (`enum`).

---

## 📋 Перелічення (Enums)

### 1. `Role`

Визначає рівень привілеїв користувача в системі:

- `SUPER_ADMIN`: Повний доступ до всіх системних налаштувань, бази даних, видачі ліцензій та конфігурації планів.
- `ADMIN`: Управління користувачами та тарифами.
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

---

## 🏗 Моделі Бази Даних (Models)

### 👤 `User`

Центральна сутність користувача платформи.

```prisma
model User {
  id           String         @id @default(uuid())
  email        String         @unique
  passwordHash String
  fullName     String?
  role         Role           @default(USER)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  licenses     License[]
  snapshots    Snapshot[]
  images       ProductImage[]

  @@map("users")
}
```

### 💎 `TariffPlan`

Динамічний тарифний план з повним набором квот та feature flags. Параметри можна налаштовувати без перезапуску сервера через адмін-панель.

```prisma
model TariffPlan {
  id            String    @id @default(uuid())
  code          String    @unique  // 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'
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

  @@map("tariff_plans")
}
```

### 🔑 `License`

Ліцензійний ключ та знімок (snapshot) квот користувача на момент підписки.

> [!IMPORTANT]
> `License` зберігає **snapshot квот** на момент видачі — щоб зміна плану адміністратором не впливала на вже видані ліцензії до закінчення їх строку.

```prisma
model License {
  id             String      @id @default(uuid())
  userId         String
  tariffPlanId   String?
  licenseKey     String      @unique // SF-STARTER-XXXX-XXXX-XXXX
  planType       PlanType    @default(STARTER)
  canCloudBackup Boolean     @default(false)
  maxXmlLimit    Int         @default(500)
  aiCredits      Int         @default(0)

  // Quota snapshot fields
  maxFeedsLimit      Int     @default(1)
  maxChannelsLimit   Int     @default(1)
  maxTeamSeats       Int     @default(1)
  hasApiAccess       Boolean @default(false)
  hasFeedDiff        Boolean @default(false)
  hasWhiteLabel      Boolean @default(false)
  hasSso             Boolean @default(false)
  hasAuditLog        Boolean @default(false)

  isActive  Boolean   @default(true)
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  tariffPlan TariffPlan? @relation(fields: [tariffPlanId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([tariffPlanId])
  @@map("licenses")
}
```

### 🧭 `NavigationItem`

Динамічний пункт бічного меню з фільтрацією за ролями та планами.

```prisma
model NavigationItem {
  id            String     @id @default(uuid())
  key           String     @unique
  labelUk       String
  labelEn       String
  path          String
  icon          String     @default("LayoutDashboard")
  order         Int        @default(0)
  isVisible     Boolean    @default(true)
  requiredRoles Role[]     @default([USER, ADMIN, SUPER_ADMIN])
  requiredPlan  PlanType?  // GROWTH, PRO, або ENTERPRISE для преміум функцій
  targetApp     TargetApp  @default(DESKTOP)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@map("navigation_items")
}
```

### 📦 `Snapshot` & `ProductImage`

Знімки каталогів та кеш зображень товарів у S3.

- `Snapshot`: зберігає `snapshotName`, `s3Key`, `sizeBytes`, `userId`. Видаляється каскадно при видаленні користувача.
- `ProductImage`: зберігає `originalUrl`, `cloudUrl`, `s3Key`, `userId`.

---

### 🏢 Заплановані Моделі: Мультипостачальництво (Фаза 2)

Для підтримки роботи з кількома постачальниками на один товар (`Master Product`) заплановано розширення схеми моделями:

- **`Supplier` (Постачальник)**: зберігає назву дистриб'ютора, посилання на вхідний прайс (`feedUrl`), формат (`feedType`), індивідуальний відсоток націнки (`defaultMarginPercent`), термін доставки (`deliveryDays`), пріоритет складу (`priority`) та валюту розрахунків.
- **`SupplierOffer` (Пропозиція постачальника)**: зв'язує товар та постачальника. Зберігає артикул постачальника (`supplierSku`), штрих-код (`barcode`), вхідну собівартість (`costPrice`) та кількість залишку (`stock`).
- **`TariffPlan.maxSuppliersLimit`**: квота на максимальну кількість підключених постачальників (Starter: 1, Growth: 3, Pro: 15, Enterprise: ∞).
