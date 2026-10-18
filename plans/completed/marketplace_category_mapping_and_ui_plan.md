# План: Довідник категорій маркетплейсів (`rz_id` / `portal_id`), мапінг категорій постачальника, комісії та редизайн вкладки «Категорії»

- **Статус**: `✅ Реалізовано (100% E2E PASS)`
- **Гілка**: `feat/marketplace-category-mapping`
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
     2. назва категорії була **українською мовою**.

2. **Prom.ua (`portal_id` / `portal_url`)**:
   - Використовує атрибут **`portal_id`** у тегу `<category>`:
     ```xml
     <categories>
       <category id="101" portal_id="140209">Вимикачі та розетки</category>
     </categories>
     ```

3. **Епіцентр К (`EpicentrK`) та Алло (`Allo`)**:
   - Вимагають прив'язки до точного коду кінцевої категорії маркетплейсу (`category_code` / `allo_id`) та відповідної української назви категорії, оскільки від коду кінцевої категорії залежить обов'язковий набір характеристик (`<param>`) та ставка роялті.

---

## 2. Реалізована архітектура (Slices 1–4)

1. **Slice 1 (`@smartfeed/shared`)**:
   - Створено `packages/shared/src/constants/marketplace-categories-rozetka.ts` та `marketplace-categories-seed.ts` із 30+ реальними категоріями Rozetka (`rz_id`), Prom.ua (`portal_id`) та Епіцентр (`category_code`).
   - Створено `packages/shared/src/utils/marketplace-category-matcher.ts` (`parseMarketplaceCategoryUrl` для витягнення `4674585` з URL `rozetka.com.ua/.../c4674585/` та `suggestMarketplaceCategory` для розумного авто-мапінгу).
   - Оновлено `packages/shared/src/dtos/supplier-category.dto.ts`.
2. **Slice 2 (`@smartfeed/backend-api`)**:
   - Додано таблиці `MarketplaceCategory` (`marketplace_categories`) та `SupplierCategoryMarketplaceMap` (`supplier_category_marketplace_maps`) у `services/backend-api/prisma/schema.prisma`, а також поля мапінгу та `commissionPercent` у `SupplierCategoryRule`.
   - Створено CQRS хендлери `GetMarketplaceCategoriesHandler` (`GET /suppliers/marketplace-categories`) та `CreateMarketplaceCategoryHandler` (`POST /suppliers/marketplace-categories`), розширено `UpdateSupplierCategoryHandler` та `GetSupplierCategoriesHandler`.
3. **Slice 3 (`@smartfeed/desktop` Local DB & API Client)**:
   - Створено `apps/desktop/src/services/local-db/mock/mock-marketplace-categories.ts` та розширено `mock-supplier-categories.ts`, `suppliers.service.ts`, `supplier-categories.ts`.
4. **Slice 4 (`@smartfeed/desktop` UI Redesign & i18n)**:
   - Оновлено `SupplierCategoriesToolbar.tsx`, `SupplierCategoryRow.tsx`, `SupplierCategoriesTab.tsx`, створено `useSupplierCategoriesState.ts`, `MarketplaceCategoryPickerDialog.tsx` та `MarketplaceCategoryCustomForm.tsx`.
   - Забезпечено 100% двомовний паритет у `uk/suppliers.json` та `en/suppliers.json`.

---

## 3. Критерії готовності (6-Point Definition of Done, `AGENT-04`)

- [x] **Критерій 1**: Backend Supertest E2E тести (`suppliers.e2e-spec.ts`) проходять на 100% на реальній БД з `cleanDatabase` (10/10 PASS).
- [x] **Критерій 2**: Backend `dist/` скомпільовано та верифіковано (`pnpm --filter @smartfeed/backend-api build`).
- [x] **Критерій 3**: Frontend Playwright E2E тести (`suppliers-drawer-and-single-request.spec.ts`) проходять на 100% (6/6 PASS) з перевіркою мапінгу `rz_id`, комісії маркетплейсу та парсингу URL Rozetka.
- [x] **Критерій 4**: Статична типізація (`tsc --noEmit`) — 0 помилок.
- [x] **Критерій 5**: Перевірка локалізації (`pnpm i18n:check`) — 100% паритет `uk` / `en`.
- [x] **Критерій 6**: Перевірка інваріантів (`pnpm invariants:check`) — 0 порушень, усі створені/змінені файли дотримуються бюджету рядків (`CORE-04`).
