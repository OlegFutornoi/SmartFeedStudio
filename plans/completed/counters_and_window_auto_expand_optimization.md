# План: Оптимізація модуля лічильників (категорії/товари/фіди) та автоматичне згортання меню з розгортанням вікон

## 1. Мета та контекст

1. **Проблема лічильника категорій (`Категорії: 5` при `Товари: 0` і `Фіди: 0`) та аудит модуля лічильників:**
   - **Корінь проблеми 1 ( розсинхрон Backend vs Local-First у `AppCounterService.hydrateSuppliers`):** У браузерному/гібридному режимі `GET /suppliers` повертає `categoriesCount: s._count.categoryRules` (застарілі правила мапінгу `SupplierCategoryRule` у БД, наприклад `5` для `Mobioptom`), тоді як `productsCount: 0` і `activeFeedsCount: 0`. Водночас вкладка «Категорії» читає локальні категорії через `getSupplierCategories()`, де при `feeds.length === 0` повертається `[]`. `AppCounterService.hydrateSuppliers` гідратував лише `activeFeedsCount` та `productsCount`, повністю ігноруючи `categoriesCount` та `activeCategoriesCount`.
   - **Корінь проблеми 2 (Fallback на застарілі значення при обнуленні):** У `mock-driver.ts` (`getCountersSummary`) та `src-tauri/src/db/mod.rs` (`get_counters_summary`) словники `feedsBySupplierId` та `productsBySupplierId` містили ключі лише для постачальників із `> 0` записами. Коли останній фід або товар видалявся, значення ставало `undefined`, і оператор `summary.productsBySupplierId[s.id] ?? s.productsCount ?? 0` повертав старе значення. Аналогічно у `getSupplierById` використовувався `feeds || s.activeFeedsCount || 0`, де `0` вважався хибним.
   - **Корінь проблеми 3 (Пропущені виклики `syncCounters` та очищення осиротілих категорій):**
     - `createFeedSource` у `mock-feeds.ts` не викликав `syncCounters(state)`.
     - `deleteFeedSource` у `mock-feeds.ts` викликав `syncCounters(state)` до очищення категорій, а не після.
     - `bulkDeleteProducts` у `mock-products.ts` видаляв товари без перерахунку `supplierCategories` та без виклику `syncCounters(state)`.
     - У Rust SQLite (`src-tauri/src/db/mod.rs` та `suppliers.rs`) при `sync_counters` не видалялися осиротілі категорії з `local_supplier_categories`, коли у постачальника 0 фідів.
   - **Корінь проблеми 4 (Інвалідація кешу та черговість подій):** `cachedSuppliers` у `apps/desktop/src/lib/api/suppliers.ts` та `appCounterService` у `counter.service.ts` не інвалідувалися синхронно при виклику `emitDataSync`, а `useSuppliersCrud.ts` міг пропустити `fetchSuppliers(true)`, якщо попередній запит ще тривав (`isFetchingRef.current`).

2. **Автоматичне згортання лівого меню (`Sidebar`) та розгортання вікон на весь робочий простір:**
   - При відкритті будь-якого вікна (`SheetContent`, `DialogContent`, `SupplierDrawerSheet`, `SupplierFormSheet`, `ImportFeedWizardDialog`, `MarketplaceCategoryDrawer`, `ProductDetailsDrawer` тощо) ліве бічне меню автоматично згортається (`collapseSidebar()` -> `isCollapsed = true`, ширина `72px`).
   - Усі панелі/вікна відкриваються одразу в розгорнутому режимі (`isExpanded = true` за замовчуванням, `w-full md:w-[calc(100vw-72px)] max-w-none` при згорнутому сайдбарі або `md:w-[calc(100vw-16rem)]` при розгорнутому), заповнюючи весь робочий простір впритул до згорнутого меню, зі збереженням можливості перемикання кнопкою «На весь екран / Згорнути вікно» (`Minimize2` / `Maximize2`).

## 2. Архітектурні зміни по файлах

### Частина 1: Модуль лічильників та локальна БД

- `apps/desktop/src/services/local-db/types.ts`:
  - Додати `totalCategories?: number`, `categoriesBySupplierId?: Record<string, number>`, `activeCategoriesBySupplierId?: Record<string, number>` до `LocalCountersSummary`.
- `apps/desktop/src/services/local-db/mock/mock-feeds.ts`:
  - Викликати `syncCounters(state)` у `createFeedSource` та в самому кінці `deleteFeedSource` (після каскадного очищення категорій).
- `apps/desktop/src/services/local-db/mock/mock-products.ts`:
  - У `bulkDeleteProducts` оновлювати/очищати `state.supplierCategories` (якщо у постачальника залишилось `0` товарів і `0` фідів — очищати категорії; оновлювати `productCount` категорій) та викликати `syncCounters(state)`.
- `apps/desktop/src/services/local-db/mock-driver.ts`:
  - У `getCountersSummary()` ініціалізувати `0` для всіх постачальників у `this.state.suppliers` та повертати точні `categoriesBySupplierId`, `activeCategoriesBySupplierId` і `totalCategories` (примусово `0`, якщо у постачальника `feeds === 0` або `products === 0`).
- `apps/desktop/src-tauri/src/db/mod.rs` та `apps/desktop/src-tauri/src/db/suppliers.rs`:
  - Додати `total_categories`, `categories_by_supplier_id`, `active_categories_by_supplier_id` у `LocalCountersSummary` (`mod.rs`), очищати осиротілі категорії без фідів у `sync_counters`, а в `suppliers.rs` повертати `0` для `categories_count`/`active_categories_count`, якщо у постачальника `0` фідів або `0` товарів.
- `apps/desktop/src/services/counters/counter.service.ts` та `apps/desktop/src/services/counters/useAppCounters.ts`:
  - Додати `totalCategories`, `categoriesBySupplierId`, `activeCategoriesBySupplierId` у `AppCountersState`.
  - Підписати `AppCounterService` на `SMARTFEED_DATA_SYNC_EVENT` для миттєвої інвалідації кешу.
  - У `hydrateSuppliers()` гідратувати `activeFeedsCount`, `productsCount`, `categoriesCount`, `activeCategoriesCount` із жорстким інваріантом: якщо `activeFeedsCount === 0` або `productsCount === 0`, то `categoriesCount = 0` та `activeCategoriesCount = 0`.
- `apps/desktop/src/lib/api/suppliers.ts`, `apps/desktop/src/lib/api/supplier-categories.ts`, `apps/desktop/src/modules/suppliers/hooks/useSuppliersCrud.ts`:
  - Автоматично скидати `cachedSuppliers` при `SMARTFEED_DATA_SYNC_EVENT`.
  - Використовувати `appCounterService.hydrateSuppliers([supplier])` у `getSupplierById`.
  - Викликати `emitDataSync(['suppliers', 'categories'])` при зміні стану категорій у `supplier-categories.ts`.
  - У `useSuppliersCrud.ts` стабілізувати `fetchSuppliers` (прибрати `selectedSupplierForDrawer` із залежностей `useCallback`) та гарантувати виконання відкладеного `force`-оновлення після завершення поточного запиту.

### Частина 2: Авто-згортання меню та авто-розгортання вікон

- `apps/desktop/src/contexts/SidebarContext.tsx`:
  - Додати метод `collapseSidebar: () => void` та безпечний хук `useOptionalSidebar()`.
- `apps/desktop/src/components/ui/sheet.tsx` та `apps/desktop/src/components/ui/dialog.tsx`:
  - У `SheetContent` (коли `side !== 'left'`) та `DialogContent` автоматично викликати `collapseSidebar()` при монтуванні.
- `apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerSheet.tsx`:
  - Встановити `isExpanded = true` за замовчуванням при відкритті та обчислювати ширину з урахуванням стану сайдбару (`w-full md:w-[calc(100vw-72px)] max-w-none` коли меню згорнуте, або `w-full md:w-[calc(100vw-16rem)] max-w-none` коли розгорнуте).
- `apps/desktop/src/modules/suppliers/components/forms/useSupplierFormState.ts` та `SupplierFormSheet.tsx`:
  - Встановити `isExpanded = true` за замовчуванням при відкритті та застосувати аналогічний розрахунок ширини до межі сайдбару.
- `apps/desktop/src/components/feeds/ImportFeedWizardDialog.tsx` та `WizardDialogHeader.tsx`:
  - Додати стан `isExpanded = true` за замовчуванням, кнопку розгортання/згортання у заголовок та ширину на весь робочий простір.
- `apps/desktop/src/modules/suppliers/components/details/tabs/MarketplaceCategoryDrawer.tsx` та `MarketplaceCategoryDrawerHeader.tsx`:
  - Встановити `isExpanded = true` за замовчуванням при відкритті та кнопку перемикання розміру.
- `apps/desktop/src/components/products/ProductDetailsDrawer.tsx`:
  - При відкритті викликати `collapseSidebar()`, встановити `isExpanded = true` за замовчуванням та додати кнопку перемикання масштабу у шапку.

## 3. Критерії готовності (DoD)

- [ ] Лічильник категорій постачальника дорівнює `0`, коли немає фідів або товарів, і синхронно оновлюється у таблиці та шухляді після імпорту/видалення фідів, товарів та категорій.
- [ ] При відкритті будь-якого вікна ліве меню автоматично згортається до `72px`, а саме вікно автоматично розгортається на весь робочий простір (`max-w-none`, `md:w-[calc(100vw-72px)]`).
- [ ] E2E-тести `suppliers-drawer-and-single-request.spec.ts` проходять на 100%.
- [ ] `tsc --noEmit`, `pnpm i18n:check`, `pnpm invariants:check` проходять з 0 помилок.
