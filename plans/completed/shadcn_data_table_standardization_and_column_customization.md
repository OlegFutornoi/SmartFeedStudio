# 📊 План реалізації: Повна стандартизація таблиць під еталон shadcn/ui, компактна типографіка та компонент Customize Columns (`DataTableViewOptions`) в обох кабінетах

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 11.10.2026  
> **Контур охоплення:** 100% паритет між **Кабінетом користувача** (`apps/desktop`) та **Адмін-порталом** (`apps/admin-portal`)  
> **Виконавці:** `agents_frontend` (UI/UX, архітектура, компоненти) & `agents_review` (аудит, DoD, якість)  
> **Джерело правди:** Офіційні блоки та архітектура `ui.shadcn.com` (data-table, data-table-view-options, faceted-filters, compact typography)

---

## 🎯 1. Мета та бізнес-вимоги для ОБОХ кабінетів

1. **Еталонний компонент "Customize Columns" (`DataTableViewOptions`)**:
   - Інтегрувати стандартизований shadcn dropdown-компонент `[ ◫ Налаштувати стовпці ∨ ]` (`Customize Columns`) для **всіх таблиць в обох кабінетах**.
   - Користувач може в один клік обирати, які стовпчики показувати, а які приховувати.
   - **За замовчуванням приховати другорядні детальні стовпчики** (із запам'ятовуванням у `localStorage`):
     - **🏛️ Адмін-портал**:
       - **Ліцензії (`LicensesTable`)**: стовпчики `Ліміт XML` (`xmlLimit`), `AI Кредити` (`aiCredits`), `Хмарний бекап` (`cloudBackup`) приховані за замовчуванням (як виділено на скріншоті).
       - **Користувачі (`UsersTable`)**: стовпчики `Організація / Команда` (`team`), `Дата реєстрації` (`created`) налаштовуються через Customize Columns.
       - **Документи (`LegalDocumentsTable`)**: налаштування стовпчиків `Slug`, `Версія`, `Оновлено`.
       - **Транзакції (`TransactionsTable`)**: налаштування стовпчиків `Період`, `Шлюз / Картка`, `Дата`.
     - **💻 Кабінет користувача (Desktop)**:
       - **Каталог товарів (`ProductsTable`)**: Customize Columns у тулбарі каталогу — налаштування видимості `Зображення` (`image`), `Постачальник` (`supplier`), `Маржа` (`margin`), `Залишок` (`stock`), `Роздрібна ціна` (`retailPrice`).
       - **Підключені фіди (`ConnectedFeedsList`)**: стандартизація в shadcn `Table` з Customize Columns (`Формат`, `Остання синхронізація`, `Кількість товарів`, `Статус`).
       - **Команда (`TeamMembersList`)**: стандартизація в shadcn `Table` з Customize Columns (`Роль`, `Email`, `Статус`, `Дата додавання`).
       - **Фіди постачальника (`SupplierFeedsTable`)**: приведення до єдиного shadcn стилю.

2. **Очищення тулбарів від візуального сміття (Ліквідація "для чого тут?")**:
   - **Видалення зайвого сортування з тулбару**: ліквідувати громіздкий селектор `⇅ Сортування: [ Найновіші ∨ ]`. Впровадити стандартне shadcn сортування кліком по заголовках стовпчиків (`DataTableColumnHeader`).
   - **Видалення дублюючих лічильників**: бейджі `Показано 4 з 4 ліцензій` та `1 користувач` у верхніх тулбарах видаляються. Уся пагінація та підрахунок рядків професійно зосереджені у підвалі `TablePagination` (`Показано 1-4 із 4 записів`).
   - Побудова фільтрів як чистих об'єктів/компонентів за зразком shadcn (`DataTableFacetedFilter`).

3. **Компактна типографіка та відступи (Ліквідація велетенського шрифту)**:
   - Встановити єдиний корпоративний компактний Enterprise-стиль для всіх таблиць обох кабінетів:
     - Базовий розмір шрифту таблиці: суворо `text-xs` (12px), жодного `text-sm` (14px).
     - Заголовки `TableHead`: висота `h-8.5` - `h-9`, падінги `px-3 py-2`, шрифт `text-xs font-semibold text-muted-foreground`.
     - Комірки `TableCell`: компактні падінги `px-3 py-2 text-xs align-middle text-foreground` (ліквідація велетенського `p-4` (16px)).
     - Бейджі статусів та тарифів: компактні `text-[10px] h-5 px-1.5 py-0 font-medium`.
     - Аватари користувачів: компактний розмір `size-7 text-[10px]` з другорядним email `text-[11px] font-mono`.

4. **100% паритет компонентів**:
   - Створення єдиного `table.tsx` у `apps/desktop/src/components/ui/table.tsx` з ідентичними токенами до `apps/admin-portal/src/components/ui/table.tsx`.
   - Усі файли та компоненти вміщуються у ліміт <250 рядків.

---

## 🏛 2. Архітектура компонентів та хуків (Обидва кабінети)

### 1. Універсальний хук `useColumnVisibility`

Розміщується в:

- `apps/admin-portal/src/hooks/useColumnVisibility.ts`
- `apps/desktop/src/hooks/useColumnVisibility.ts`

```typescript
export interface ColumnConfig<T extends string = string> {
  id: T;
  labelUk: string;
  labelEn: string;
  defaultVisible?: boolean;
  canHide?: boolean;
}

export function useColumnVisibility<T extends string>(
  storageKey: string,
  columns: ColumnConfig<T>[],
) {
  // 1. Читання збереженого стану з localStorage або дефолтного
  // 2. toggleColumn(id, isVisible)
  // 3. resetToDefaults()
  // 4. Повернення { visibleColumns, toggleColumn, resetToDefaults, columnOptions }
}
```

### 2. Еталонний shadcn-компонент `DataTableViewOptions`

Розміщується в:

- `apps/admin-portal/src/components/ui/DataTableViewOptions.tsx`
- `apps/desktop/src/components/ui/DataTableViewOptions.tsx`

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs border-border/80 bg-background/80 hover:bg-muted/60"
    >
      <SlidersHorizontal className="size-3.5" />
      <span>{isUk ? 'Налаштувати стовпці' : 'Customize Columns'}</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-[190px]">
    <DropdownMenuLabel className="text-xs">
      {isUk ? 'Відображення стовпців' : 'Toggle Columns'}
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    {columnOptions
      .filter((col) => col.canHide)
      .map((col) => (
        <DropdownMenuCheckboxItem
          key={col.id}
          checked={col.isVisible}
          onCheckedChange={(checked) => toggleColumn(col.id, !!checked)}
          onSelect={(e) => e.preventDefault()}
          className="text-xs"
        >
          {col.label}
        </DropdownMenuCheckboxItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Компонент сортування `DataTableColumnHeader`

Розміщується в:

- `apps/admin-portal/src/components/ui/DataTableColumnHeader.tsx`
- `apps/desktop/src/components/ui/DataTableColumnHeader.tsx`

---

## 📋 3. Поетапний план реалізації

### 🔹 Етап 1: Базові UI-примітиви та токени таблиць в обох кабінетах

- [x] Оновити `apps/admin-portal/src/components/ui/table.tsx`:
  - Базова таблиця: `text-xs`.
  - `TableHead`: `h-8.5` - `h-9`, `px-3 py-2 text-xs font-semibold text-muted-foreground`.
  - `TableCell`: `px-3 py-2 text-xs text-foreground` (ліквідація `p-4`).
- [x] Створити `apps/desktop/src/components/ui/table.tsx` з ідентичними компактними токенами.
- [x] Створити `useColumnVisibility.ts` в `apps/admin-portal` та `apps/desktop`.
- [x] Створити `DataTableViewOptions.tsx` в `apps/admin-portal` та `apps/desktop`.
- [x] Створити `DataTableColumnHeader.tsx` в обох додатках.

### 🔹 Етап 2: Кабінет користувача (Desktop) — Каталог товарів (`ProductsTable`)

- [x] Додати `DataTableViewOptions` до тулбару товарів:
  - Конфігурація колонок:
    - Обов'язкові (`canHide: false`): Чекбокс, `Артикул / SKU`, `Назва товару`, `Дії`.
    - Налаштовувані (`canHide: true`): `Зображення` (дефолт `true`), `Постачальник` (дефолт `true`), `Роздрібна ціна` (дефолт `true`), `Маржа` (дефолт `false`), `Залишок` (дефолт `false`).
- [x] Перевести `ProductsTable` на новий `table.tsx`:
  - Компактні `px-3 py-2 text-xs` комірки.
  - Клікабельні сортування колонок (`Ціна`, `Назва`, `Залишок`) через `DataTableColumnHeader`.

### 🔹 Етап 3: Кабінет користувача (Desktop) — Фіди, Постачальники та Команда

- [x] Стандартизувати `ConnectedFeedsList.tsx`:
  - Перевести на структуру shadcn `Table` з `DataTableViewOptions`.
  - Колонки: `Назва та формат`, `Джерело/URL`, `Товарів`, `Остання синхронізація`, `Статус`, `Дії`.
- [x] Стандартизувати `SupplierFeedsTable.tsx` та `WizardSampleProductsTable.tsx`:
  - Компактний стиль `text-xs`, `px-3 py-2`.
- [x] Оновити `TeamMembersList.tsx` та `TeamMemberRow.tsx`:
  - Аватар: `size-7 text-[10px]`, ім'я: `text-xs font-medium`.

### 🔹 Етап 4: Адмін-портал — Ліцензії (`LicensesTable` & `LicensesTableToolbar`)

- [x] Очистити `LicensesTableToolbar`:
  - Видалити `⇅ Сортування: [ Найновіші ∨ ]` та бейдж `Показано 4 з 4 ліцензій`.
  - Додати кнопку `[ ◫ Налаштувати стовпці ∨ ]` праворуч біля кнопки оновлення.
- [x] Налаштувати конфігурацію колонок у `LicensesTable`:
  - **За замовчуванням приховані**: `Ліміт XML` (`xmlLimit: false`), `AI Кредити` (`aiCredits: false`), `Хмарний бекап` (`cloudBackup: false`).
  - **Обов'язкові**: `Ліцензійний ключ` (`key`), `Дії` (`actions`).
  - **За замовчуванням видимі**: `Користувач` (`user`), `Тарифний план` (`tier`), `Статус` (`status`), `Термін дії` (`expiresAt`).
- [x] Інтегрувати сортування через заголовки колонок (`DataTableColumnHeader`).
- [x] Оновити `LicensesTableRow`: бейджі `text-[10px] h-5`, шрифт `text-xs`.

### 🔹 Етап 5: Адмін-портал — Користувачі (`UsersTable`), Документи та Транзакції

- [x] Очистити `UsersTableToolbar`: видалити бейдж `1 користувач`, додати `DataTableViewOptions`.
- [x] Налаштувати видимість колонок у `UsersTable`:
  - Налаштовувані: `Організація / Команда`, `Дата реєстрації`.
- [x] Зменшити розміри в `UserTableRow`:
  - Аватар: `size-7 text-[10px]` (замість `h-9 w-9`).
  - Ім'я: `text-xs font-medium` (замість `text-sm font-semibold`).
  - Email: `text-[11px] font-mono text-muted-foreground`.
  - Бейджі ролей та статусу: `text-[10px] h-5 px-1.5`.
- [x] Оновити `LegalDocumentsTable.tsx` та `TransactionsTable.tsx`:
  - Додати `DataTableViewOptions`.
  - Компактні падінги `px-3 py-2 text-xs`.

### 🔹 Етап 6: Автоматизовані тести та перевірка обох кабінетів

- [x] Оновити Playwright E2E тести в `apps/admin-portal/e2e/licenses-table.spec.ts` та `users-table.spec.ts`:
  - 100% тестів пройдено (9 з 9 в licenses, 9 з 9 в users).
- [x] Оновити Playwright E2E тести в `apps/desktop/e2e/products-grid-view.spec.ts` та `feed-ingestion-cascade.spec.ts`:
  - 100% тестів пройдено (5 з 5 в products-grid, 4 з 4 в cascade, 99 з 99 в повному desktop e2e наборі).
- [x] Перевірити `pnpm format` та `tsc --noEmit` в усіх пакетах (0 помилок).

---

## 🛡 4. Критерії готовності (Definition of Done)

1. ✅ **Обидва кабінети** (Desktop + Admin) відповідають еталону `ui.shadcn.com`: компактний шрифт `text-xs`, акуратні відступи `px-3 py-2`, нуль велетенського `p-4`.
2. ✅ Працюючий `Customize Columns` (`DataTableViewOptions`) у всіх ключових таблицях обох кабінетів зі збереженням у `localStorage`.
3. ✅ За замовчуванням приховані стовпчики `Ліміт XML`, `AI Кредити`, `Хмарний бекап` у таблиці ліцензій.
4. ✅ Тулбари очищені від зайвих лічильників та селекторів сортування в обох кабінетах.
5. ✅ Всі компоненти відповідають ліміту <250-300 рядків.
6. ✅ 100% двомовний паритет (UA ⇄ EN).
7. ✅ 100% Playwright та Jest тестів PASS, 0 помилок типізації, сувора типізація без `any`.
