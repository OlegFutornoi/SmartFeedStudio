# 🏛️ SmartFeed Studio — Професійний CRM-кабінет та створення постачальника

**Статус:** 🔄 IN_PROGRESS (Розробка завершена, фаза TDD тестування та валідації нових CRM-фіч)  
**Автор:** `@agents_planner`, `@agents_backend`, `@agents_frontend`, `@agents_qa`  
**Дата створення:** 16 жовтня 2026 р.  
**Цільові модулі:** `apps/desktop`, `packages/shared`, `services/backend-api`, `apps/admin-portal`  
**Керуючі правила:** `core.md`, `agents.md`, `backend.md`, `database.md`, `frontend.md`, `i18n.md`, `security.md`, `docs_and_ops.md`

---

## 🎯 1. Аналіз проблеми та цілі рефакторингу

На основі зауважень користувача та наданих скріншотів ідентифіковано три критичні проблеми поточного інтерфейсу:

1. **Дисбаланс розмірів вікон (Window Sizing Jitter):**
   - Вікно перегляду постачальника (`SupplierDrawerSheet`) відкривається як простора CRM-панель (`sm:max-w-2xl ... xl:max-w-5xl 2xl:max-w-6xl`) з можливістю розгортання на весь екран.
   - Вікно створення/редагування постачальника (`SupplierFormSheet`) стиснуте у вузьку бічну панель (`sm:max-w-md md:max-w-lg lg:max-w-xl` ~500px), змушуючи всі поля тіснитися в одну колонку. При переході між переглядом та редагуванням відбувається різкий стрибок розмірів, що ламає відчуття цілісного професійного додатку.
2. **Відсутність повноцінного бізнес-профілю постачальника (CRM Metadata):**
   - Зараз постачальник містить лише базові поля: назва, код, сайт, один телефон та один email.
   - Відсутні ключові атрибути B2B-співпраці (як у референсі CRM-систем Attio / Twenty): дані юридичної особи (ЄДРПОУ, юр. назва), категорія/галузь бізнесу, сегмент співпраці, персональні дані менеджера (ПІБ, посада, робочий Telegram, прямий телефон), а також адреса складу відвантажень.
3. **Неестетичний блок завантаження фото:**
   - Поточний віджет `SupplierAvatarPicker` виконаний у вигляді грубої рамки з окремою кнопкою та громіздким технічним текстом про компресію зображень.
   - Немає сучасного інтерактивного UI (hover overlay, drag-and-drop, підтримка прямого Logo URL) та автопідтягування логотипу за доменом вебсайту компанії.

---

## 🏛️ 2. Концепція рішення & Архітектура

```mermaid
graph TD
    UI[Desktop & Admin Portal UI] -->|Form / Drawer| CRM_Form[Harmonized CRM Drawer max-w-4xl]
    CRM_Form --> Logo_Picker[Smart Avatar Picker: Hover/Drop + Domain Auto-Logo]
    CRM_Form --> Sections[Organized CRM Sections: General, Company, Manager, Warehouse, Commercial]
    CRM_Form --> Shared[@smartfeed/shared: SupplierDto & CreateSupplierDto]

    Shared --> Backend[services/backend-api: NestJS CQRS + Prisma PostgreSQL 16]
    Shared --> Desktop_DB[apps/desktop: Tauri v2 rusqlite SQLCipher]
    Shared --> Mock_Driver[apps/desktop: mockDatabaseDriver Parity]

    Backend --> DB[(PostgreSQL 16 suppliers)]
    Desktop_DB --> Local_DB[(SQLite local_suppliers)]
```

### 2.1. Гармонізація розмірів вікон (Harmonized Drawer System)

- Стандартизувати ширину `SupplierFormSheet` у повній відповідності до `SupplierDrawerSheet`:
  `w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl` (із підтримкою кнопки «На весь екран»).
- Двоколонковий адаптивний лейаут:
  - **Ліва колонка (Brand & General):** інтерактивна картка бренду (смарт-аватарка, назва, код, сайт, статус).
  - **Права колонка (CRM Details):** структуровані картки або акордеон/вкладки (Реквізити компанії, Контактний менеджер, Склад, Комерційні умови).

### 2.2. Преміальний смарт-аватар & Auto-Logo за доменом

- **Hover/Click-to-Upload Avatar:** кругла або `rounded-2xl` преміум-аватарка 72x72 з іконкою камери при наведенні, прямим кліком для вибору файлу або перетягуванням (drag-and-drop).
- **Auto-Logo Discovery:** при введенні вебсайту компанії (наприклад `brain.com.ua` чи `rozetka.com.ua`) додаток автоматично пропонує завантажити офіційний логотип/фавікон у високій роздільності через перевірені резолвери (`unavatar.io/{domain}`, `Google Favicon High-Res`).
- **Logo URL Option:** можливість вставити пряме посилання на логотип (як у Twenty/Attio) або скинути до фірмової кольорової плашки з ініціалами.
- Повне видалення неестетичного технічного тексту та окремих незграбних кнопок.

### 2.3. Розширення моделі даних постачальника (Enterprise B2B Fields)

| Категорія         | Поле (DTO / DB)                                                                        | Тип         | Опис / Приклад                                                     |
| :---------------- | :------------------------------------------------------------------------------------- | :---------- | :----------------------------------------------------------------- |
| **Основне**       | `name`, `code`, `website`, `logoUrl`, `isActive`                                       | String/Bool | Базова ідентифікація                                               |
| **Компанія**      | `legalName`                                                                            | String?     | Юридична назва (напр. _ТОВ "Брейн Дистриб'юшн"_)                   |
| **Компанія**      | `taxId`                                                                                | String?     | Код ЄДРПОУ / ІПН (напр. _30370505_)                                |
| **Компанія**      | `industry`                                                                             | String?     | Галузь (напр. _IT & Споживча електроніка_)                         |
| **Компанія**      | `segment`                                                                              | String?     | Сегмент (напр. _Офіційний дистриб'ютор_, _Виробник_, _Дропшипінг_) |
| **Менеджер**      | `managerName`                                                                          | String?     | ПІБ відповідального менеджера (напр. _Олександр Коваленко_)        |
| **Менеджер**      | `managerPosition`                                                                      | String?     | Посада (напр. _Керівник B2B-відділу_)                              |
| **Менеджер**      | `managerPhone`                                                                         | String?     | Прямий контактний телефон менеджера                                |
| **Менеджер**      | `managerEmail`                                                                         | String?     | Прямий робочий email менеджера                                     |
| **Менеджер**      | `managerTelegram`                                                                      | String?     | Telegram нікнейм/канал (напр. `@brain_b2b_support`)                |
| **Локація/Склад** | `country`                                                                              | String?     | Країна реєстрації / складу (напр. _Україна_)                       |
| **Локація/Склад** | `city`                                                                                 | String?     | Місто базування / відвантаження (напр. _Київ_)                     |
| **Локація/Склад** | `address`                                                                              | String?     | Адреса складу / відділення (напр. _вул. Васильківська, 34_)        |
| **Локація/Склад** | `postcode`                                                                             | String?     | Поштовий індекс                                                    |
| **Умови**         | `notes`, `baseCurrency`, `defaultMarginPercent`, `defaultFixedMarkup`, `priceRounding` | Mixed       | Валютні та комерційні правила                                      |

---

## 🛠️ 3. Поетапний план реалізації (Bite-Sized Vertical Slices)

### Етап 1: Спільні контракти `@smartfeed/shared`

- [x] Оновити `packages/shared/src/dtos/supplier.dto.ts`:
  - Розширити `SupplierDtoSchema`, `CreateSupplierDtoSchema`, `UpdateSupplierDtoSchema` 13 новими опціональними полями.
  - Додати санітизацію та валідацію: `taxId`, `managerEmail`, `managerTelegram`, `segment`, `industry`.
- [x] Виконати компіляцію спільних пакетів: `pnpm --filter @smartfeed/shared build`.

### Етап 2: Бекенд (NestJS + Prisma PostgreSQL 16)

- [x] Оновити `services/backend-api/prisma/schema.prisma`:
  - Додати поля `legalName`, `taxId`, `industry`, `segment`, `managerName`, `managerPosition`, `managerPhone`, `managerEmail`, `managerTelegram`, `country`, `city`, `address`, `postcode` до моделі `Supplier`.
- [x] Оновити `services/backend-api/src/modules/suppliers/dto/supplier.dto.ts` (Class-Validator та Swagger анотації).
- [x] Оновити `CreateSupplierHandler`, `UpdateSupplierHandler`, `GetSuppliersHandler` для мапінгу нових полів.
- [x] Запустити тест валідації DTO та хендлерів: `pnpm --filter @smartfeed/backend-api test:e2e test/suppliers.e2e-spec.ts` (8/8 PASSED).

### Етап 3: Десктоп SQLite (Rust rusqlite) & Mock Parity

- [x] Оновити схему БД в `apps/desktop/src-tauri/src/db/mod.rs`:
  - Додати `ALTER TABLE local_suppliers ADD COLUMN ...` для всіх нових полів без втрати існуючих локальних даних.
- [x] Оновити Rust-структури в `apps/desktop/src-tauri/src/models.rs`:
  - `SupplierDto`, `CreateSupplierDto`, `UpdateSupplierDto`.
- [x] Оновити SQL-запити вибірки, вставки та оновлення в `apps/desktop/src-tauri/src/db/suppliers.rs`.
- [x] Оновити `apps/desktop/src/services/local-db/mock/mock-suppliers.ts` та `mock-driver.ts` для збереження 100% Mock/Real паритету.

### Етап 4: Інтернаціоналізація (i18n)

- [x] Оновити словники `apps/desktop/src/i18n/locales/uk/suppliers.json` та `en/suppliers.json`:
  - Додати ключі для всіх нових блоків: «Дані компанії», «Відповідальний менеджер», «Локація та склад», «Прямий Telegram», «Автоматичний пошук логотипу».
- [x] Запустити перевірку словників: `pnpm i18n:check` (✅ 100% parity check passed).

### Етап 5: Преміальний UI/UX Smart Avatar & Auto-Logo

- [x] Рефакторинг `apps/desktop/src/modules/suppliers/components/forms/SupplierAvatarPicker.tsx`:
  - Сучасна аватарка з hover-оверлеєм (іконка камери) та drag-and-drop.
  - Кнопка швидкого визначення логотипу за введеним доменом/вебсайтом («Підтягнути з сайту»).
  - Можливість прямого вводу URL логотипу або видалення.
  - Елегантна інтеграція без технічного сміття в тексті.

### Етап 6: Гармонізація форми постачальника (CRM Drawer Layout)

- [x] Оновити `apps/desktop/src/modules/suppliers/components/forms/SupplierFormSheet.tsx`:
  - Збільшити ширину до `w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl` (із можливістю повноекранного режиму `isExpanded`).
- [x] Декомпонувати та оновити `apps/desktop/src/modules/suppliers/components/forms/SupplierFormFields.tsx`:
  - Створити структуровані модульні секції з компактними інпутами:
    1. _Бренд та вебсайт_ (назва, код, авто-логотип, сайт).
    2. _Реквізити компанії_ (юр. назва, ЄДРПОУ, галузь, сегмент).
    3. _Контактна особа / менеджер_ (ПІБ, посада, телефон, email, Telegram з прямим посиланням).
    4. _Склад та адреса_ (країна, місто, адреса відвантажень).
    5. _Комерційні параметри_ (валюта, націнки, умови співпраці).

### Етап 7: Оновлення кабінету постачальника (Cabinet Overview Tab)

- [x] Оновити `apps/desktop/src/modules/suppliers/components/drawer/tabs/SupplierDrawerOverviewTab.tsx`:
  - Додати преміум-картки CRM для відображення компанії, менеджера (з клікабельними лінками на телефон, email, Telegram) та складу.
  - Ліквідувати захаращені або дубльовані поля «Інформація про магазин».

### Етап 8: Автоматизоване тестування та верифікація

- [x] Створено новий виділений Playwright E2E тест `apps/desktop/e2e/suppliers-crm-fields.spec.ts`:
  - Перевірка 4 CRM-карток існуючого постачальника на вкладці огляду.
  - Створення постачальника з усіма 13 CRM-полями, автопідтягуванням логотипу та валідацією в огляді кабінету.
  - Редагування CRM-даних постачальника зі збереженням та оновленням у кабінеті.
- [x] Оновлено Jest E2E тести бекенду `services/backend-api/test/suppliers.e2e-spec.ts` з перевіркою збереження та оновлення всіх 13 полів у PostgreSQL 16.
- [x] Прогнано цільові Playwright-тести: `pnpm --filter @smartfeed/desktop exec playwright test e2e/suppliers-crm-fields.spec.ts e2e/suppliers-slide-sheet.spec.ts e2e/suppliers-management.spec.ts` (11/11 PASSED).
- [x] Перевірено лінтер, агентні правила та i18n: `pnpm lint && pnpm agents:check && pnpm i18n:check` (0 errors, 0 warnings).

---

## 🛡️ 4. Критерії готовності (Definition of Done)

1. **Єдиний візуальний розмір:** вікно створення та кабінет постачальника відкриваються в однакових габаритах (`max-w-4xl`), мають опцію розгортання на весь екран і плавні анімації.
2. **CRM-повнота даних:** користувач може заповнити дані компанії (юр. назва, ЄДРПОУ, галузь), контактного менеджера (ПІБ, телефон, email, Telegram) та адресу складу.
3. **Естетичний логотип:** завантаження фото виглядає стильно, підтримує drag-and-drop, клік по аватарці та автопідтягування лого за доменом компанії.
4. **100% Mock / Real Parity:** новий функціонал однаково працює як у локальному SQLite (Tauri), так і в браузерному демо-режимі (mockDatabaseDriver) та у хмарному NestJS API.
5. **Двомовність:** 100% ключів локалізовано в `uk` та `en`, `pnpm i18n:check` проходить без помилок.
