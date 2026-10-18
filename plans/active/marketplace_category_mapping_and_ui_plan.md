# План: Довідник категорій маркетплейсів (`rz_id` / `portal_id`), мапінг категорій постачальника, комісії та редизайн вкладки «Категорії»

- **Статус**: `📝 Очікує схвалення користувача (PLAN-01)`
- **Цільові середовища**: `@smartfeed/shared`, `@smartfeed/backend-api` (PostgreSQL / Prisma), `@smartfeed/desktop` (Tauri SQLite / MockDB / React 18 UI)
- **Пов'язані інваріанти**: `ARCH-03`, `ARCH-04`, `DB-01..DB-12`, `BE-01..BE-08`, `UI-01..UI-15`, `I18N-01..I18N-06`, `AGENT-04`

---

## 1. Результати дослідження вимог маркетплейсів (Perplexity Agent API & Довідка Rozetka / Prom.ua / Епіцентр)

### 1.1. Як маркетплейси вимагають прив'язувати категорії у XML/YML прайс-листах

1. **Rozetka Marketplace (`rz_id` + українська назва кінцевої категорії)**:
   - У блоці `<categories>` кожна категорія прайс-листа повинна мати власний незмінний атрибут `id` (внутрішній ID категорії постачальника) та спеціальний атрибут **`rz_id`** — числовий ідентифікатор кінцевої категорії в каталозі Rozetka:
     ```xml
     <categories>
       <category id="101" rz_id="4674585">Зарядні станції</category>
       <category id="102" rz_id="4662497">Розумні вимикачі</category>
     </categories>
     ```
   - **Звідки береться `rz_id`**: це число після літери **`c`** в URL кінцевої категорії на сайті `rozetka.com.ua` (наприклад, з `https://rozetka.com.ua/ua/zaryadnie-stantsii-4674585/c4674585/` код дорівнює **`4674585`**).
   - **Пріоритет та модерація**: `rz_id` має вищий пріоритет за текстову назву, проте під час первинної модерації прайс-листа контент-відділ Rozetka вимагає, щоб:
     1. категорія була **кінцевою (leaf)** у дереві каталогу (не кореневий розділ),
     2. назва категорії була **українською мовою** (тому сирі російськомовні назви з фіду постачальника на кшталт _«Черные выключатели ELIOS в стеклянной 2.5D рамке»_ при експорті на маркетплейс замінюються на прив'язану українську назву категорії маркетплейсу — _«Розумні вимикачі»_ або _«Вимикачі»_).
   - Усередині `<offer>` вказується `<categoryId>101</categoryId>` (внутрішній ID), який через тег `<category id="101" rz_id="4674585">` зв'язує всі товари цієї групи з категорією Rozetka.

2. **Prom.ua (`portal_id` / `portal_url`)**:
   - Використовує атрибут **`portal_id`** у тегу `<category>`:
     ```xml
     <categories>
       <category id="101" portal_id="140209">Вимикачі та розетки</category>
     </categories>
     ```
   - Якщо одночасно вказані `portal_id` та `portal_url`, пріоритет має `portal_id`.

3. **Епіцентр К (`EpicentrK`) та Алло (`Allo`)**:
   - Вимагають прив'язки до точного коду кінцевої категорії маркетплейсу (`category_code` / ID категорії кабінету продавця) та відповідної української назви категорії, оскільки від коду кінцевої категорії залежить обов'язковий набір характеристик (`<param>`) та ставка роялті.

### 1.2. Комісія (роялті) маркетплейсу за категоріями

- На Rozetka, Prom.ua, Епіцентр та Алло **комісія за продаж залежить від категорії маркетплейсу** (від 5–7% на смартфони, ноутбуки та зарядні станції до 12–15% на електрофурнітуру, розумний дім та освітлення, і 18–20% на дрібні кабелі й чохли).
- Якщо для вузької підкатегорії окремий тариф не встановлений, маркетплейс автоматично застосовує комісію батьківської категорії вищого рівня.
- **Як це повинно працювати в SmartFeed Studio**:
  1. У довіднику категорій маркетплейсів (`marketplace_categories`) кожна категорія зберігає свою базову ставку комісії (`defaultCommissionPercent`, %).
  2. Коли користувач ставить категорії постачальника у відповідність категорію маркетплейсу (наприклад, обирає `rz_id: 4662497 — Розумні вимикачі`), у рядок категорії постачальника автоматично підставляються:
     - `externalCategoryId` (`"4662497"`),
     - `externalCategoryName` (`"Розумні вимикачі"`),
     - `commissionPercent` (`12%` — базова комісія з довідника, яку продавець може змінити вручну під свій індивідуальний тариф у кабінеті Rozetka).
  3. Маючи в одному рядку **Націнку постачальника (%)** та **Комісію маркетплейсу (%)**, система за формулою зворотного відсотка (`ShelfPrice = Cost * (1 + Margin/100) / (1 - Commission/100)`) гарантує, що комісія маркетплейсу не «з'їсть» прибуток продавця.

---

## 2. Зібраний каталог реальних категорій Rozetka (`rz_id`) для бази даних (Seed)

На основі дослідження через Perplexity Agent API та індексації URL `rozetka.com.ua/ua/.../c<ID>/` сформовано стартовий довідник реальних кінцевих категорій Rozetka (з акцентом на електрофурнітуру Livolo, гаджети Mobioptom та енергонезалежність):

### А. Електромонтажне обладнання, Вимикачі, Розетки та Розумний дім (під фіди типу Livolo)

- `4629471` — **Вимикачі** (`Інструменти й обладнання / Електромонтажне обладнання / Розетки та вимикачі / Вимикачі`) — Комісія: `12%`
- `4662497` — **Розумні вимикачі** (`Розумний дім / Керування електроприладами / Розумні вимикачі`) — Комісія: `12%`
- `4638447` — **Смарт-вимикачі та сенсорні панелі** (`Розумний будинок / Керування освітленням / Розумні вимикачі`) — Комісія: `12%`
- `4629473` — **Розетки** (`Інструменти й обладнання / Електромонтажне обладнання / Розетки та вимикачі / Розетки`) — Комісія: `12%`
- `4631383` — **Рамки для розеток та вимикачів** (`Інструменти й обладнання / Електромонтажне обладнання / Рамки для розеток та вимикачів`) — Комісія: `12%`
- `4675031` — **Комплектуючі для розеток та вимикачів** (`Інструменти й обладнання / Електромонтажне обладнання / Комплектуючі для розеток та вимикачів`) — Комісія: `12%`
- `4638471` — **Розумні реле і димери** (`Розумний будинок / Керування електроприладами / Розумні реле і димери`) — Комісія: `12%`
- `4638359` — **Керування електроприладами в розумному будинку** (`Розумний будинок / Керування електроприладами`) — Комісія: `12%`
- `4671408` — **Терморегулятори** (`Інструменти й обладнання / Кліматичне обладнання / Терморегулятори`) — Комісія: `12%`
- `4632863` — **Розумний дім (комплекти та хаби)** (`Смартфони, ТВ і електроніка / Розумний дім`) — Комісія: `10%`
- `4659438` — **Датчики розумного дому (руху, відкриття, протікання)** (`Розумний дім / Безпека та автоматизація / Датчики`) — Комісія: `12%`
- `4627063` — **Автоматичні вимикачі та ПЗВ** (`Інструменти й обладнання / Електромонтажне обладнання / Автоматичні вимикачі`) — Комісія: `10%`
- `4632128` — **Світлодіодні лампи (LED)** (`Товари для дому / Освітлення / Лампочки / Світлодіодні лампи`) — Комісія: `15%`

### Б. Енергонезалежність та Живлення (включно з категорією зі скріншоту користувача)

- `4674585` — **Зарядні станції** (`Смартфони, ТВ і електроніка / Повербанки та зарядні станції / Зарядні станції`) — Комісія: `7%`
- `4626998` — **УМБ та повербанки (Power Bank)** (`Смартфони, ТВ і електроніка / Повербанки та зарядні станції / УМБ`) — Комісія: `10%`
- `4669865` — **Інвертори та перетворювачі напруги** (`Інструменти й обладнання / Електрообладнання / Інвертори`) — Комісія: `8%`
- `4626993` — **Сонячні панелі та батареї** (`Інструменти й обладнання / Альтернативна енергетика / Сонячні панелі`) — Комісія: `8%`
- `4632832` — **Мережеві фільтри, адаптери та подовжувачі** (`Комп'ютери та ноутбуки / Аксесуари / Мережеві фільтри`) — Комісія: `15%`

### В. Смартфони, Гаджети та Комп'ютерна периферія (під фіди типу Mobioptom)

- `80003` — **Смартфони та мобільні телефони** (`Смартфони, ТВ і електроніка / Телефони / Смартфони`) — Комісія: `5%`
- `80027` — **Навушники та гарнітури** (`Смартфони, ТВ і електроніка / Аудіо / Навушники`) — Комісія: `12%`
- `4627814` — **Смарт-годинники та фітнес-браслети** (`Смартфони, ТВ і електроніка / Смарт-годинники`) — Комісія: `10%`
- `4650630` — **Зарядні пристрої для телефонів та гаджетів** (`Смартфони, ТВ і електроніка / Аксесуари / Зарядні пристрої`) — Комісія: `18%`
- `4664188` — **Кабелі для зарядки та синхронізації** (`Смартфони, ТВ і електроніка / Аксесуари / Кабелі зарядки`) — Комісія: `20%`
- `4623351` — **Кабелі, адаптери та перехідники** (`Комп'ютери та ноутбуки / Кабелі та перехідники`) — Комісія: `20%`
- `4632833` — **Мережеві кабелі ( патч-корди, силові)** (`Комп'ютери та ноутбуки / Мережеве обладнання / Мережеві кабелі`) — Комісія: `18%`
- `4623561` — **Маршрутизатори (Wi-Fi роутери)** (`Комп'ютери та ноутбуки / Мережеве обладнання / Маршрутизатори`) — Комісія: `8%`
- `80004` — **Ноутбуки** (`Комп'ютери та ноутбуки / Ноутбуки`) — Комісія: `5%`

_(Також у довідник додаються базові категорії `PROM` з `portal_id` та `EPICENTR` з `category_code`, плюс можливість користувача в 1 клік додати будь-яку категорію просто вставивши URL сторінки з Rozetka або завантаживши CSV/JSON)._

---

## 3. Проектування бази даних та спільних контрактів (`DB-01..DB-12`, `ARCH-03`)

### 3.1. Нова таблиця `MarketplaceCategory` (`marketplace_categories`) у Prisma (`services/backend-api/prisma/schema.prisma`)

```prisma
model MarketplaceCategory {
  id                       String                 @id @default(cuid())
  marketplaceCode          String                 @default("ROZETKA") @map("marketplace_code") // ROZETKA, PROM, EPICENTR, ALLO
  externalId               String                 @map("external_id") // Напр. "4674585" (rz_id) або "140209" (portal_id)
  xmlAttributeName         String                 @default("rz_id") @map("xml_attribute_name") // "rz_id", "portal_id", "category_code"
  nameUk                   String                 @map("name_uk") // "Зарядні станції"
  nameEn                   String?                @map("name_en") // "Power Stations"
  fullPathUk               String?                @map("full_path_uk") // "Смартфони, ТВ і електроніка / Повербанки та зарядні станції / Зарядні станції"
  parentExternalId         String?                @map("parent_external_id")
  url                      String?                @map("url") // "https://rozetka.com.ua/ua/zaryadnie-stantsii-4674585/c4674585/"
  defaultCommissionPercent Decimal                @default(0) @db.Decimal(5, 2) @map("default_commission_percent")
  defaultFixedFee          Decimal                @default(0) @db.Decimal(10, 2) @map("default_fixed_fee")
  isLeaf                   Boolean                @default(true) @map("is_leaf")
  isActive                 Boolean                @default(true) @map("is_active")
  createdAt                DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                DateTime               @updatedAt @map("updated_at") @db.Timestamptz(6)

  supplierCategoryRules    SupplierCategoryRule[]

  @@unique([marketplaceCode, externalId])
  @@index([marketplaceCode, isActive])
  @@index([externalId])
  @@index([nameUk(ops: raw("gin_trgm_ops"))], type: Gin)
  @@map("marketplace_categories")
}
```

### 3.2. Розширення моделі `SupplierCategoryRule` (`supplier_category_rules`)

Додаємо поля прив'язки до категорії маркетплейсу та комісії маркетплейсу:

```prisma
model SupplierCategoryRule {
  id                    String               @id @default(cuid())
  supplierId            String               @map("supplier_id")
  supplier              Supplier             @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  feedCategoryId        String               @map("feed_category_id")
  name                  String
  parentId              String?              @map("parent_id")
  isActive              Boolean              @default(true) @map("is_active")
  marginPercent         Decimal?             @db.Decimal(5, 2) @map("margin_percent")
  fixedMarkup           Decimal?             @db.Decimal(10, 2) @map("fixed_markup")
  commissionPercent     Decimal?             @db.Decimal(5, 2) @map("commission_percent")
  marketplaceCategoryId String?              @map("marketplace_category_id")
  marketplaceCategory   MarketplaceCategory? @relation(fields: [marketplaceCategoryId], references: [id], onDelete: SetNull)
  marketplaceCode       String?              @default("ROZETKA") @map("marketplace_code")
  externalCategoryId    String?              @map("external_category_id")
  externalCategoryName  String?              @map("external_category_name")
  productCount          Int                  @default(0) @map("product_count")
  createdAt             DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@unique([supplierId, feedCategoryId])
  @@index([supplierId])
  @@index([supplierId, isActive])
  @@index([marketplaceCategoryId])
  @@map("supplier_category_rules")
}
```

### 3.3. Контракти у `@smartfeed/shared` (`packages/shared/src/dtos/supplier-category.dto.ts`)

1. **`MarketplaceCategoryDtoSchema`**:
   - `id`, `marketplaceCode` (`'ROZETKA' | 'PROM' | 'EPICENTR' | 'ALLO'`), `externalId`, `xmlAttributeName`, `nameUk`, `nameEn`, `fullPathUk`, `url`, `defaultCommissionPercent`, `defaultFixedFee`, `isLeaf`, `isActive`.
2. **Утиліта парсингу URL Rozetka (`parseMarketplaceCategoryUrl(input: string)`)**:
   - Якщо користувач вставляє посилання виду `https://rozetka.com.ua/ua/zaryadnie-stantsii-4674585/c4674585/`, утиліта автоматично витягує `{ marketplaceCode: 'ROZETKA', externalId: '4674585' }`.
3. **Розширення `SupplierCategoryRuleDtoSchema` та `UpdateSupplierCategoryRuleDtoSchema`**:
   - `commissionPercent: z.number().min(0).max(99).nullable().optional()`
   - `marketplaceCategoryId: z.string().nullable().optional()`
   - `marketplaceCode: z.string().nullable().optional()`
   - `externalCategoryId: z.string().nullable().optional()`
   - `externalCategoryName: z.string().nullable().optional()`
4. **Утиліта розумного авто-мапінгу (`suggestMarketplaceCategory(supplierCategoryName, catalog)`)**:
   - Автоматично зіставляє російськомовні та україномовні назви категорій постачальника з еталонними категоріями маркетплейсу за словником токенів і синонімів (наприклад: _«выключатели ELIOS / сенсорный выключатель»_ ➔ `4662497 Розумні вимикачі`, _«рамка стеклянная»_ ➔ `4631383 Рамки для розеток та вимикачів`, _«розетки»_ ➔ `4629473 Розетки`, _«зарядні станції / ecoflow / bluetti»_ ➔ `4674585 Зарядні станції`, _«павербанк / умб»_ ➔ `4626998 УМБ та повербанки`).

---

## 4. Модернізація дизайну сторінки «Категорії» (`UI-01..UI-15`)

### 4.1. Усунення візуальних проблем поточного екрана (Скріншот 1)

1. **Замість двоповерхового роздутого тулбара — єдиний компактний інлайн-тулбар (`UI-15`)**:
   - Картка таблиці має компактний верхній тулбар (`px-3.5 py-2.5 border-b border-border/60 bg-muted/20`), який об'єднує:
     - Пошук за назвою категорії або `rz_id` (`h-8 w-52`),
     - Фільтр джерела фіду (`Всі фіди` / `livolo.kiev.ua`),
     - Фільтр стану мапінгу (`Всі` / `Змаплені` / `Без мапінгу`),
     - Статистичні бейджі (`Активно: 78/78`, `Змаплено: 78/78`),
     - Кнопку **«Авто-підбір (AI/Smart)»** (автоматично прив'язує категорії Rozetka та підтягує комісії в 1 клік),
     - Кнопку **«Довідник МП»** (відкриває діалог бази категорій маркетплейсів з можливістю додати категорію за URL Rozetka `.../c4674585/`),
     - Компактні кнопки `Увімкнути всі` / `Вимкнути всі`.
2. **Ліквідація порожньої білої зони — збалансована 6-колонкова таблиця високої щільності (`UI-06`, `UI-12`)**:
   - **Колонка 1: `Статус` (`w-[56px]`)** — компактний `Switch` (`scale-90`).
   - **Колонка 2: `Категорія постачальника` (`min-w-[230px]`)** — назва категорії з прайсу + під нею компактний мета-рядок з іконкою фіду (`livolo.kiev.ua`) та кодом у фіді (`ID: 104`).
   - **Колонка 3: `Категорія маркетплейсу (Rozetka rz_id)` (`min-w-[260px]`)** — інтерактивний тригер вибору категорії маркетплейсу:
     - Коли змаплено: відображає офіційну назву українською (наприклад, **Розумні вимикачі**) + моноширинний бейдж **`rz_id: 4662497`** (`font-mono text-2xs px-1.5 py-0.5 rounded-sm bg-muted border border-border/60`).
     - Коли не змаплено: стримана кнопка `Обрати категорію МП…` (`border-dashed`) + підказка авто-підбору.
   - **Колонка 4: `Товари` (`w-[72px] text-center tabular-nums`)** — чисте число SKU без текстового сміття (`75`).
   - **Колонка 5: `Націнка (%)` (`w-[115px] text-right`)** — компактний інпут `h-7 w-18 font-mono tabular-nums` націнки постачальника (`marginPercent %`).
   - **Колонка 6: `Комісія МП (%)` (`w-[125px] text-right pr-3.5`)** — компактний інпут `h-7 w-18 font-mono tabular-nums` комісії маркетплейсу (`commissionPercent %`), який автоматично підтягується при виборі категорії маркетплейсу, але може редагуватися вручну.
3. **Модальне вікно / Поповер вибору та додавання категорії маркетплейсу (`MarketplaceCategoryPickerDialog.tsx`)**:
   - Миттєвий пошук за назвою категорії (_«Зарядні станції»_, _«Вимикачі»_), шляхом або числовим кодом (`4674585`, `4662497`).
   - **Вставка URL з Rozetka**: якщо користувач вставляє у поле пошуку або створення URL `https://rozetka.com.ua/ua/zaryadnie-stantsii-4674585/c4674585/`, діалог миттєво розпізнає `rz_id = 4674585` і знаходить або пропонує створити цю категорію в базі!
   - Можливість додати нову категорію маркетплейсу (`Назва категорії`, `Код rz_id / URL з Rozetka`, `Шлях`, `Комісія %`) прямо з цього вікна, щоб вона збереглася в таблиці `marketplace_categories`.

---

## 5. Декомпозиція на вертикальні зрізи (Tracer-Bullet Slices, `AGENT-04`)

### Slice 1: Спільні контракти `@smartfeed/shared` та каталог категорій Rozetka

- **Create**: `packages/shared/src/constants/marketplace-categories-seed.ts` (<200 рядків) — 25+ верифікованих категорій Rozetka (`rz_id`), Prom (`portal_id`), Епіцентр + словник авто-мапінгу та парсер URL `parseMarketplaceCategoryUrl`.
- **Modify**: `packages/shared/src/dtos/supplier-category.dto.ts` (<120 рядків) — схеми `MarketplaceCategoryDtoSchema`, `CreateMarketplaceCategoryDtoSchema`, оновлені `SupplierCategoryRuleDtoSchema`, `UpdateSupplierCategoryRuleDtoSchema` та `BatchAutoMapCategoriesResultDtoSchema`.
- **Build**: `pnpm --filter @smartfeed/shared build`.

### Slice 2: База даних PostgreSQL (Prisma) та NestJS CQRS Backend (TDD RED -> GREEN)

- **Modify**: `services/backend-api/prisma/schema.prisma` — модель `MarketplaceCategory` та нові поля в `SupplierCategoryRule` з `@@index([marketplaceCategoryId])` (`DB-01`) та `@db.Timestamptz(6)` (`DB-02`).
- **Create**: Міграція Prisma + сідер категорій маркетплейсів.
- **Create/Modify CQRS Handlers (1 файл = 1 хендлер, `ARCH-04`, <120 рядків)**:
  - `GetMarketplaceCategoriesHandler` (`GET /suppliers/marketplace-categories?marketplaceCode=ROZETKA&search=...`)
  - `CreateMarketplaceCategoryHandler` (`POST /suppliers/marketplace-categories`)
  - Оновлення `UpdateSupplierCategoryHandler` (`PATCH /suppliers/:id/categories/:categoryId`) для збереження `commissionPercent`, `marketplaceCategoryId`, `marketplaceCode`, `externalCategoryId`, `externalCategoryName`.
- **Test (TDD RED -> GREEN)**: `services/backend-api/test/suppliers.e2e-spec.ts` — Supertest E2E перевірка отримання довідника категорій Rozetka, створення нової категорії за URL/ID та прив'язки `rz_id` + `commissionPercent` до категорії постачальника.
- **Build**: `pnpm --filter @smartfeed/backend-api build`.

### Slice 3: Локальна БД Десктопа (`mockDatabaseDriver` + API-клієнт, 100% Parity)

- **Create**: `apps/desktop/src/services/local-db/mock/mock-marketplace-categories.ts` (<180 рядків) — ініціалізація таблиці `marketplaceCategories` у `MockDbState` зі стартовим каталогом Rozetka, пошук, додавання нової категорії маркетплейсу та функція пакетного авто-мапінгу `autoMapSupplierCategories`.
- **Modify**: `apps/desktop/src/services/local-db/mock/mock-supplier-categories.ts` (<240 рядків) — підтримка `commissionPercent`, `marketplaceCategoryId`, `marketplaceCode`, `externalCategoryId`, `externalCategoryName` (плюс автоматичний мапінг відомих категорій при первинній ініціалізації).
- **Modify**: `apps/desktop/src/lib/api/supplier-categories.ts` (<180 рядків) — методи `getMarketplaceCategories`, `createMarketplaceCategory`, `autoMapSupplierCategories` та розширений `updateSupplierCategoryRule`.

### Slice 4: Редизайн UI вкладки «Категорії» та діалог довідника маркетплейсів (`UI-01..UI-15`, `I18N-01..I18N-06`)

- **Modify**: `apps/desktop/src/modules/suppliers/components/details/tabs/SupplierCategoriesToolbar.tsx` (<170 рядків) — єдиний компактний інлайн-тулбар з фільтром мапінгу, кнопками «Авто-підбір» та «Довідник МП».
- **Modify**: `apps/desktop/src/modules/suppliers/components/details/tabs/SupplierCategoryRow.tsx` (<170 рядків) — 6-колонковий компактний рядок (`Статус`, `Категорія постачальника + Фід`, `Категорія маркетплейсу + rz_id`, `Товари`, `Націнка %`, `Комісія МП %`).
- **Create**: `apps/desktop/src/modules/suppliers/components/details/tabs/MarketplaceCategoryPickerDialog.tsx` (<220 рядків) — швидкий пошук і вибір категорії Rozetka/Prom з бази, автоматичне розпізнавання вставленого URL `rozetka.com.ua/.../c4674585/` та форма додавання власної категорії в довідник.
- **Modify**: `apps/desktop/src/modules/suppliers/components/details/tabs/SupplierCategoriesTab.tsx` (<230 рядків) — інтеграція мапінгу, комісій, авто-підбору та пікера.
- **Modify**: `apps/desktop/src/i18n/locales/uk/suppliers.json` та `en/suppliers.json` — 100% двомовний паритет.
- **Test (Playwright E2E)**: `apps/desktop/e2e/suppliers-drawer-and-single-request.spec.ts` — перевірка відображення колонок `Категорія маркетплейсу`, `Комісія МП (%)`, прив'язки `rz_id` (зокрема `4674585 Зарядні станції` та `4662497 Розумні вимикачі`), авто-підстановки комісії маркетплейсу та розпізнавання URL Rozetka.

---

## 6. Критерії готовності (6-Point Definition of Done, `AGENT-04`)

- [ ] **Критерій 1**: Backend Supertest E2E тести (`suppliers.e2e-spec.ts`) проходять на 100% на реальній БД з `cleanDatabase`.
- [ ] **Критерій 2**: Backend `dist/` скомпільовано та верифіковано (`pnpm --filter @smartfeed/backend-api build`).
- [ ] **Критерій 3**: Frontend Playwright E2E тести (`suppliers-drawer-and-single-request.spec.ts`) проходять на 100% з перевіркою мапінгу `rz_id`, комісії маркетплейсу та парсингу URL Rozetka.
- [ ] **Критерій 4**: Статична типізація (`tsc --noEmit`) — 0 помилок у всіх пакетах монорепозиторію.
- [ ] **Критерій 5**: Перевірка локалізації (`pnpm i18n:check`) — 100% паритет `uk` / `en`.
- [ ] **Критерій 6**: Перевірка інваріантів (`pnpm invariants:check`) — 0 порушень, усі файли < 250 рядків (`CORE-04`).
