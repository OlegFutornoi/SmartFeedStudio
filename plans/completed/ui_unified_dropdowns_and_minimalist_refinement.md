# 🎨 План реалізації: Уніфіковані випадаючі списки (shadcn/ui Select), деклоттеринг тулбарів та лаконічний дизайн навігації

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено: 66 admin + 93 desktop = 159 тестів)**  
> **Дата виконання:** 10.10.2026  
> **Гілка:** `feat/shadcn-dashboard-01-design`  
> **Відповідальні агенти:** `agents_review` (Аудит) + `agents_frontend` (UI/UX Реалізація)

---

## 🔍 1. Результати аудиту (Analysis & Findings)

### 🚨 Дефект 1: Темна випадашка в світлій темі (Native `<select>` bug)

- **Корінь проблеми:** У `LicensesTableToolbar.tsx`, `TransactionsFilterToolbar.tsx`, `table-pagination.tsx`, `CreateUserDialog.tsx`, та `NavigationItemDialog.tsx` використовувався нативний HTML-тег `<select>`.
- **Наслідок:** В macOS / WebKit браузер малює нативне системне вікно з темним фоном, синьою галочкою і застарілим дизайном, яке ігнорує Tailwind CSS класи та кольорову тему сайту.
- **Вирішення:** Встановлено `@radix-ui/react-select`, створено канонічний компонент `apps/admin-portal/src/components/ui/select.tsx` із токенами `bg-popover text-popover-foreground border-border shadow-md` та замінено нативний `<select>` у всіх 5 місцях на єдиний підхід.

### 🧹 Дефект 2: Захаращений тулбар (Overcluttered Toolbar)

- **Корінь проблеми:** У `LicensesTableToolbar.tsx` фільтри переносилися на 2-3 нерівні рядки (пошук, 3 фасетні фільтри, скидання, сортування, лічильник, кнопка оновлення, дублююча кнопка "Тарифи", а нижче — ще один шар дублюючих бейджів).
- **Вирішення:**
  1. Лаконічна лінійна структура тулбара: Ліва частина — компактний пошук + компактні фасетні кнопки фільтрів (`h-8 text-xs`). Права частина — стильний сортувальний `Select` (`h-8 text-xs`), лічильник і кнопка `Refresh`.
  2. Видалено зайву дублюючу кнопку "Тарифи" з тулбара таблиці (усунено порушення правила Zero Duplicate CTAs).
  3. Очищено підвал від надлишкових дублів тегів фільтрації, які вже відображаються у випадаючих кнопках.

### ✨ Дефект 3: Естетика бічного меню (Sidebar Aesthetics & Comparison)

- **Корінь проблеми:** У реальному `SidebarNavItem.tsx` використовувався розмір `text-sm` (14px) та стандартний фокусний outline браузера, через що активні пункти отримували грубу рамку замість витонченого вигляду.
- **Еталон користувача:** Симулятор меню користувача з `/navigation` (`text-xs`, радіус `rounded-lg`, контрастні чіткі іконки `text-primary` / `text-foreground`, витончені відступи `px-3 py-2`, гармонійні бордери `border-border/40`).
- **Вирішення:** Оновлено `SidebarNavItem.tsx` в `apps/admin-portal` та `apps/desktop` до еталонного стилю: `text-xs font-medium rounded-lg`, чіткі іконки (`text-primary` на активному), витончений фон активного стану `bg-muted/70 text-foreground border-border/50 shadow-xs`, плавні переходи та відсутність грубих рамок фокусу.

### 📱 Дефект 4: Адаптивність для десктопів та планшетів

- **Вирішення:** Планшетні медіа-запити (`md:`, `lg:`): плавний перенос тулбарів без горизонтального вильоту сторінки, адаптивні відступи контенту (`px-4 sm:px-6 lg:px-8`), горизонтальний скрол таблиць зі збереженням sticky заголовків.

---

## 📋 2. Результати виконання плану робіт (Execution Results)

### Крок 1: Створення та інтеграція `@/components/ui/select.tsx` в `admin-portal`

- [x] Встановити `@radix-ui/react-select` (виконано).
- [x] Створити `apps/admin-portal/src/components/ui/select.tsx` за стандартами shadcn/ui (з підтримкою `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`).
- [x] Протестувати підтримку світлої та темної тем.

### Крок 2: Заміна нативного `<select>` на shadcn `Select`

- [x] `LicensesTableToolbar.tsx`: заміна сортування на `<Select>`.
- [x] `TransactionsFilterToolbar.tsx`: заміна фільтра статусу на `<Select>`.
- [x] `table-pagination.tsx`: заміна вибору кількості рядків (`Rows per page`) на `<Select>`.
- [x] `CreateUserDialog.tsx`: заміна вибору організації на `<Select>`.
- [x] `NavigationItemDialog.tsx`: заміна вибору TargetApp та MinPlan на `<Select>`.

### Крок 3: Рефакторинг тулбарів та усунення візуального шуму

- [x] `LicensesTableToolbar.tsx`: видалення дублюючої кнопки "Тарифи", прибирання надлишкових бейджів, оптимізація розмірів та відступів.
- [x] Забезпечення компактного, акуратного розміщення елементів на одному рівні.

### Крок 4: Оновлення естетики Sidebar (еталон "гарно")

- [x] `SidebarNavItem.tsx` (`admin-portal`): оновлення розміру тексту до `text-xs`, плавні радіуси `rounded-lg`, гармонійний фон активного елемента з тонкою рамкою `border-border/50`, чіткі іконки (`text-primary` на активному).
- [x] `SidebarNavItem.tsx` (`desktop`): синхронізація стилю для єдиного UI/UX стандарту обох додатків.

### Крок 5: Верифікація та тестування

- [x] Запуск TypeScript перевірки: `pnpm --filter admin-portal exec tsc --noEmit` та `pnpm --filter @smartfeed/desktop exec tsc --noEmit` (0 помилок).
- [x] Запуск повного пакету тестів: `pnpm test:admin` (66/66 passed) та `pnpm test:desktop` (93/93 passed) — загалом 159 тестів пройдено успішно.
