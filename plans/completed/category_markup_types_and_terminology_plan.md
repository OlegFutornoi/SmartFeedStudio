# 📋 План: Людинозрозуміла термінологія («Привʼязано») та взаємовиключна націнка на категорію (`%` або `₴`)

## 1. Огляд та бізнес-мета

На основі запиту користувача необхідно реалізувати два ключові покращення у вкладці керування категоріями постачальника:

1. **Людинозрозуміла українська термінологія**:
   - Замінити технічний сленг **«Змаплено» / «Змаплені» / «Фільтр мапінгу»** на природні та зрозумілі для користувача терміни: **«Привʼязано»**, **«Привʼязані»** та **«Фільтр привʼязки»**.
2. **Вибір типу націнки на категорію: Відсоткова (`%`) АБО Пряма фіксована сума (`₴`)**:
   - Користувач повинен мати змогу задати на категорію товарів **або відсоток націнки** (наприклад, `25%`), **або фіксовану суму в гривнях** (наприклад, `+100 ₴` на кожен товар цієї категорії).
   - **Сувора взаємовиключність (Mutual Exclusivity)**: одночасно для однієї категорії може діяти **лише один** тип націнки. Система повинна однозначно знати, який саме режим обрано (`PERCENT` чи `FIXED`), і при збереженні одного типу автоматично очищувати протилежний (`null`).

---

## 2. Архітектура БД, Спільних Контрактів та Формули Ціноутворення

### 2.1. Схема бази даних (`services/backend-api/prisma/schema.prisma`)

У таблиці `supplier_category_rules` (модель `SupplierCategoryRule`) вже присутні числові поля `margin_percent` (`Decimal(5, 2)`) та `fixed_markup` (`Decimal(10, 2)`). Для 100% однозначної ідентифікації обраного режиму додаємо поле `markupType`:

- `markupType String @default("PERCENT") @map("markup_type")` — приймає значення `'PERCENT'` або `'FIXED'`.
- Інваріант цілісності даних:
  - Коли `markupType === 'PERCENT'` $\rightarrow$ використовується `marginPercent`, а `fixedMarkup = null`.
  - Коли `markupType === 'FIXED'` $\rightarrow$ використовується `fixedMarkup`, а `marginPercent = null`.

### 2.2. Спільні контракти (`packages/shared/src/dtos/supplier-category.dto.ts`)

- Оголосити схему типу націнки:
  ```ts
  export const CategoryMarkupTypeSchema = z.enum(['PERCENT', 'FIXED']);
  export type CategoryMarkupType = z.infer<typeof CategoryMarkupTypeSchema>;
  ```
- Розширити `SupplierCategoryRuleDtoSchema` та `UpdateSupplierCategoryRuleDtoSchema` полем:
  ```ts
  markupType: CategoryMarkupTypeSchema.default('PERCENT').optional(),
  ```

### 2.3. Математичний рушій розрахунку ціни (`packages/shared/src/utils/pricing-calculator.ts`)

- Розширити інтерфейс `PricingRuleItem` необов'язковим полем `markupType?: 'PERCENT' | 'FIXED'`.
- У функції `calculateBaseSellingPrice` при застосуванні правила категорії (`matchedRuleType: 'CATEGORY'`):
  - Якщо `markupType === 'FIXED'` (або задано `fixedMarkup > 0` при порожньому `marginPercent`):
    $$\text{SellingPrice} = \text{CostPrice} + \text{fixedMarkup}$$
    (`appliedMarginPercent = 0`, `appliedFixedMarkup = fixedMarkup`).
  - Якщо `markupType === 'PERCENT'`:
    $$\text{SellingPrice} = \text{CostPrice} \times \left(1 + \frac{\text{marginPercent}}{100}\right)$$
    (`appliedMarginPercent = marginPercent`, `appliedFixedMarkup = 0`).

---

## 3. Коригування CQRS запитів та обробників Бекенду і Локальної БД

### 3.1. Backend API (`services/backend-api/src/modules/suppliers/`)

1. **DTO валідація (`dto/supplier-rules.dto.ts`)**:
   - Додати в `UpdateSupplierCategoryDto`:
     ```ts
     @IsOptional()
     @IsIn(['PERCENT', 'FIXED'])
     markupType?: 'PERCENT' | 'FIXED';
     ```
2. **Command Handler (`commands/handlers/update-supplier-category.handler.ts`)**:
   - Реалізувати детерміновану логіку взаємовиключності при оновленні або створенні правила категорії:
     - Якщо в DTO передано `markupType === 'FIXED'` або передано `fixedMarkup !== undefined` (при `markupType !== 'PERCENT'`):
       - Встановити `data.markupType = 'FIXED'`, `data.fixedMarkup = dto.fixedMarkup`, `data.marginPercent = null`.
     - Якщо в DTO передано `markupType === 'PERCENT'` або передано `marginPercent !== undefined` (при `markupType !== 'FIXED'`):
       - Встановити `data.markupType = 'PERCENT'`, `data.marginPercent = dto.marginPercent`, `data.fixedMarkup = null`.
   - Повертати `markupType` у відповіді контролера.
3. **Query Handler (`queries/get-supplier-categories.handler.ts`)**:
   - Повертати поле `markupType: (rule.markupType as 'PERCENT' | 'FIXED') || (rule.fixedMarkup !== null && rule.marginPercent === null ? 'FIXED' : 'PERCENT')` для кожної категорії.

### 3.2. Локальна БД та Mock Driver (`apps/desktop/src/services/local-db/mock/mock-supplier-categories.ts`)

- Забезпечити 100% паритет (`FE-04`):
  - Зберігати `markupType` у стані категорій постачальника.
  - При виклику `updateSupplierCategoryRule` із `markupType: 'FIXED'` обнуляти `marginPercent = null` і зберігати `fixedMarkup`.
  - При виклику з `markupType: 'PERCENT'` обнуляти `fixedMarkup = null` і зберігати `marginPercent`.

---

## 4. Дизайн UI/UX та Локалізація (`apps/desktop`)

### 4.1. Виправлення термінології у словниках (`uk/suppliers.json` та `SupplierCategoriesToolbar.tsx`)

- Замінити у `apps/desktop/src/i18n/locales/uk/suppliers.json` та дефолтних значеннях тулбара:
  - `mappedCategoriesStat`: `«Змаплено»` $\rightarrow$ **`«Привʼязано»`**
  - `filterMappedOnly`: `«Змаплені»` $\rightarrow$ **`«Привʼязані»`**
  - `filterMappingAria`: `«Фільтр мапінгу»` $\rightarrow$ **`«Фільтр привʼязки»`**

### 4.2. Компонент вибору націнки в рядку таблиці (`SupplierCategoryRow.tsx` та `SupplierCategoriesTableHeader.tsx`)

1. **Заголовок таблиці (`SupplierCategoriesTableHeader.tsx`)**:
   - Змінити назву колонки з `Націнка (%)` на лаконічне **`Націнка`** (оскільки в таблиці тепер можуть бути як `%`, так і `₴`).
2. **Сегментований контрол націнки (`SupplierCategoryRow.tsx`)**:
   - Замість простого поля зі статичним знаком `%` створити єдиний акуратний блок висотою `h-7` (`inline-flex items-center rounded-md border border-input bg-background/90 p-0.5 gap-0.5`):
     - **Числове поле вводу (`Input`)**:
       - Без зайвої зовнішньої рамки всередині групи або компактно зліва (`w-14 h-6 text-xs text-right font-mono tabular-nums border-0 focus-visible:ring-0 px-1.5`).
       - Якщо активний режим `'PERCENT'` — редагує `category.marginPercent` (placeholder: базова націнка постачальника, `max="500"`).
       - Якщо активний режим `'FIXED'` — редагує `category.fixedMarkup` (placeholder: `'0'`, `max="100000"`).
     - **Інтерактивний перемикач одиниці `[ % | ₴ ]`**:
       - Дві компактні кнопки-пігулки (`h-6 px-1.5 text-2xs font-mono font-medium rounded-sm transition-colors`):
         - Кнопка **`%`** (`data-testid="category-markup-type-percent-${category.id}"`)
         - Кнопка **`₴`** (`data-testid="category-markup-type-fixed-${category.id}"`)
       - Активна одиниця виділяється семантичним стилем (`bg-primary text-primary-foreground shadow-2xs`), неактивна — `text-muted-foreground hover:text-foreground hover:bg-muted/60`.
       - При перемиканні з `%` на `₴` (або навпаки) поточне введене число зберігається у відповідне поле нового типу, а старе поле автоматично стає `null`, щоб користувачу не доводилося вводити цифру заново, якщо він спочатку ввів `100`, а потім натиснув `₴`.

---

## 5. Покроковий план реалізації (Tracer-Bullet Slicing)

1. **Крок 1 (Shared Contracts & Pricing Engine)**:
   - Оновити `packages/shared/src/dtos/supplier-category.dto.ts` та `packages/shared/src/utils/pricing-calculator.ts`.
   - Зібрати пакет `@smartfeed/shared` (`pnpm --filter @smartfeed/shared build`).
2. **Крок 2 (Prisma Schema & Backend CQRS)**:
   - Додати `markupType` у `services/backend-api/prisma/schema.prisma`, згенерувати Prisma Client та синхронізувати схему.
   - Оновити `supplier-rules.dto.ts`, `update-supplier-category.handler.ts` та `get-supplier-categories.handler.ts`.
   - Написати та запустити Supertest E2E тест у `services/backend-api/test/suppliers.e2e-spec.ts` для перевірки збереження `%` і `₴` та взаємовиключності.
   - Зібрати бекенд (`pnpm --filter @smartfeed/backend-api build`).
3. **Крок 3 (Frontend UI, Mock Driver & Localization)**:
   - Оновити `uk/suppliers.json` та `en/suppliers.json` («Привʼязано», підказки для `%` та `₴`).
   - Оновити `mock-supplier-categories.ts` для підтримки `markupType` та взаємовиключності.
   - Оновити `SupplierCategoriesToolbar.tsx`, `SupplierCategoriesTableHeader.tsx` та `SupplierCategoryRow.tsx` (сегментований контрол `[ число ] [ % | ₴ ]`).
4. **Крок 4 (Верифікація та E2E тестування)**:
   - Оновити Playwright тест `apps/desktop/e2e/suppliers-drawer-and-single-request.spec.ts` (перевірка напису «Привʼязано» та перемикання націнки на `100 ₴`).
   - Запустити всі 6 гейтів якості (`AGENT-04`).

---

## 6. Критерії готовності (6-Point Definition of Done, `AGENT-04`)

- [x] Слово «Змаплено» / «Змаплені» повністю замінено на зрозуміле «Привʼязано» / «Привʼязані».
- [x] У БД, контрактах `@smartfeed/shared`, бекенді та мок-драйвері додано підтримку `markupType` (`'PERCENT' | 'FIXED'`) із суворою взаємовиключністю полів `marginPercent` та `fixedMarkup`.
- [x] У таблиці категорій реалізовано ергономічний UI-контрол із перемикачем `[ % | ₴ ]`, що дозволяє задати або відсоток, або пряму суму в гривнях.
- [x] Backend Supertest E2E та Frontend Playwright E2E тести проходять на 100%.
- [x] Статична типізація (`tsc --noEmit`) та `pnpm i18n:check` проходять з 0 помилок.
- [x] Перевірка інваріантів (`pnpm invariants:check`) та ліміту рядків файлів (`< 250` рядків, `CORE-04`) проходить без порушень.
