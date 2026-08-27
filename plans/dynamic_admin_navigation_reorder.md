> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 27.08.2026

# 🧭 План: Динамічна зміна позицій пунктів меню Admin Portal (як у користувача Desktop)

## 📌 Опис та мета

Забезпечити повноцінне керування динамічною структурою меню **Admin Portal** на сторінці `/navigation` (у вкладці **Admin**) так само, як це реалізовано для користувача клієнтського застосунку (**Desktop**):

1. Ліквідувати порожній стан (`Пункти меню відсутні або не знайдено`) у вкладці `Admin`, додавши системні пункти меню адмін-панелі до сідера бази даних (`TargetApp.ADMIN_PORTAL`).
2. Виправити логіку переміщення елементів (Move Up / Move Down) у компоненті `NavigationItemList` / `navigation/page.tsx`, щоб сортування відбувалося коректно всередині обраного додатку (`targetApp`), а не по глобальному змішаному масиву.
3. Зробити сайдбар Admin Portal (`Sidebar.tsx`) динамічним — відображати пункти меню у порядку, заданому в базі даних через `NavigationContext`, із захистом від дублюючих запитів (`frontend_network_dedup.md`) та безпечним fallback.

---

## 🏗️ Детальний план змін

### 1. Бекенд та База даних (`services/backend-api`)

- **`prisma/seed.ts`**:
  - Додати системні пункти меню для `TargetApp.ADMIN_PORTAL`:
    - `admin_dashboard`: "Дашборд" / "Dashboard", path: `/`, icon: `LayoutDashboard`, order: 1, `targetApp: ADMIN_PORTAL`, `requiredRoles: [SUPER_ADMIN, ADMIN]`
    - `admin_users`: "Користувачі" / "Users", path: `/users`, icon: `Users`, order: 2, `targetApp: ADMIN_PORTAL`, `requiredRoles: [SUPER_ADMIN, ADMIN]`
    - `admin_plans`: "Тарифи" / "Tariff Plans", path: `/plans`, icon: `Layers`, order: 3, `targetApp: ADMIN_PORTAL`, `requiredRoles: [SUPER_ADMIN, ADMIN]`
    - `admin_licenses`: "Ліцензії" / "Licenses", path: `/licenses`, icon: `KeyRound`, order: 4, `targetApp: ADMIN_PORTAL`, `requiredRoles: [SUPER_ADMIN, ADMIN]`
    - `admin_navigation`: "Навігація меню" / "Navigation Menu", path: `/navigation`, icon: `Compass`, order: 5, `targetApp: ADMIN_PORTAL`, `requiredRoles: [SUPER_ADMIN, ADMIN]`
  - Виконати сідування (`pnpm prisma:seed`), щоб записи з'явилися в PostgreSQL.

### 2. Виправлення логіки сортування на сторінці Навігації (`apps/admin-portal`)

- **`NavigationItemList.tsx` & `NavigationItemRow.tsx`**:
  - Передавати `item` або `id` у колбеки `onMoveUp(item)` / `onMoveDown(item)` або індекс всередині `filteredItems`.
- **`apps/admin-portal/src/app/(dashboard)/navigation/page.tsx`**:
  - Виправити `handleMove`: знаходити елемент у поточному фільтрованому списку (`filteredItems`), міняти місцями з сусіднім сусіднього індексу, призначати нові значення `order: 1, 2, 3...` для відповідного `targetApp` та надсилати в `api.reorderNavigationItems`.
  - Оновлювати локальний стейт `items`, щоб порядок одразу відтворювався в інтерфейсі.

### 3. Динамічний Сайдбар в Admin Portal (`apps/admin-portal`)

- **`apps/admin-portal/src/contexts/NavigationContext.tsx`**:
  - Створити контекст навігації для адмінки з кешуванням через `useRef` (захист від дублюючих запитів `isFetchingRef`, `lastFetchedTokenRef`).
  - Отримувати список меню через `GET /api/navigation?app=ADMIN_PORTAL`.
  - Мати надійний дефолтний список (`DEFAULT_ADMIN_NAVIGATION_ITEMS`), щоб при переході чи відсутності мережі сайдбар не зникав і не блимав.
- **`apps/admin-portal/src/components/layout/sidebar.tsx`**:
  - Інтегрувати динамічні пункти з `useNavigation()` для секції `ГОЛОВНЕ МЕНЮ`.
  - Зберегти всі `data-testid` (`nav-item-dashboard`, `nav-item-users`, `nav-item-plans`, `nav-item-licenses`, `nav-item-navigation`) для 100% проходження Playwright тестів.
  - При зміні позиції пунктів у `/navigation` сайдбар миттєво оновлює порядок відображення пунктів.

---

## 🧪 План верифікації та тестів

1. **Типізація**:
   - `pnpm --filter admin-portal exec tsc --noEmit`
   - `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
2. **Playwright E2E**:
   - Запуск `pnpm test:admin` — перевірка того, що вкладка `Admin` показує 5 пунктів, сортування працює, зміна порядку оновлює сайдбар, і всі існуючі тести проходять.
3. **Візуальна перевірка**:
   - Скріншот вкладки `Admin` на сторінці `/navigation` з пунктами меню та стрілками переміщення.
