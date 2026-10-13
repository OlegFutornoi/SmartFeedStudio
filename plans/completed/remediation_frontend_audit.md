# 💻 План системної оптимізації та усунення недоліків фронтенду (`apps/desktop` та `apps/admin-portal`)

> **Агент-виконавець:** `@agents_frontend`  
> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Цільовий стек:** React 18, Next.js 14 App Router, Tauri v2, Tailwind CSS, shadcn/ui, Playwright  
> **Дата виконання:** 14.10.2026

---

## 📌 1. Резюме аудиту фронтенду

Фронтенд-архітектура монорепозиторію демонструє високий рівень відповідності:

- ✅ **100% двомовний паритет UA ⇄ EN** (`pnpm i18n:check` проходить успішно без жодного пропущеного ключа).
- ✅ **100% path alias `@/`** (нуль відносних імпортів `../` у коді десктопу та адмін-порталу).
- ✅ **Нуль сторонніх позасистемних кольорів** (жодного використання `purple-*`, `violet-*`, `pink-*`, `fuchsia-*`).
- ✅ **Дотримання вимог Solid Sticky Headers** (`sticky top-0 bg-card z-10`).
- ✅ **100% бюджет модульності компонентів (<250 рядків)** досягнуто для всіх модифікованих файлів.

### Результати скорочення розмірів файлів:

1. `apps/desktop/src/modules/suppliers/components/list/SuppliersListPage.tsx`: **370 рядків ➔ 191 рядок** (декомпозовано на `useSuppliersListPageState`, `useSuppliersFilterPagination`, `useSuppliersCrud`, `SuppliersEmptyState`, `SuppliersDialogsContainer`).
2. `apps/desktop/src/modules/suppliers/components/list/SuppliersDataTable.tsx`: **337 рядків ➔ 120 рядків** (декомпозовано за допомогою `SupplierTableRow.tsx`).
3. `apps/desktop/src/services/local-db/mock-driver.ts`: **331 рядок ➔ 184 рядки** (чистий тонкий фасад з прямою делегацією до підмодулів).
4. `apps/desktop/src/contexts/AuthContext.tsx`: **326 рядків ➔ 249 рядків** (ізольовано роботу з localStorage у `authSessionStorage.ts`).
5. `apps/admin-portal/src/app/(dashboard)/navigation/page.tsx`: **301 рядок ➔ 107 рядків** (винесено `useNavigationPageState.ts` та `NavigationFeedbackAlerts.tsx`).
6. `apps/admin-portal/src/components/users/UsersTable.tsx`: **291 рядок ➔ 221 рядок** (винесено конфігурацію колонок та фільтрів у `usersTableConfig.ts`).

---

## 🎯 2. Класифікація усунених дефектів

| ID        | Область                    | Рівень        | Опис дефекту                                                                                          | Статус        |
| :-------- | :------------------------- | :------------ | :---------------------------------------------------------------------------------------------------- | :------------ |
| **FE-01** | Component Modularity       | **P1 (High)** | `SuppliersListPage.tsx` (370 рядків) містить забагато UI-станів та бізнес-обробників                  | ✅ Виправлено |
| **FE-02** | Component Modularity       | **P1 (High)** | `SuppliersDataTable.tsx` (337 рядків) інлайнить рендеринг усіх рядків та комірок                      | ✅ Виправлено |
| **FE-03** | State & Storage Decoupling | **P1 (High)** | `AuthContext.tsx` (326 рядків) змішує управління стейтом React з прямою роботою з localStorage        | ✅ Виправлено |
| **FE-04** | Desktop Local DB           | **P2 (Med)**  | `mock-driver.ts` (331 рядок) та `client.ts` (328 рядків) мають накопичувальний характер               | ✅ Виправлено |
| **FE-05** | Admin Portal Modularity    | **P2 (Med)**  | `navigation/page.tsx` (301 рядок) та `UsersTable.tsx` (291 рядок) потребують винесення субкомпонентів | ✅ Виправлено |
| **FE-06** | Hook Optimization          | **P2 (Med)**  | `useSuppliersListPageState.ts`, `useSuppliersFilterPagination.ts`, `useNavigationPageState.ts`        | ✅ Виправлено |

---

## 🛠 3. Виконані етапи оптимізації фронтенду

### 🔹 Етап 1: Декомпозиція модуля Постачальників (`Suppliers`)

- Створено `SupplierTableRow.tsx` (238 рядків) — ізольований рендер комірок таблиці та дій.
- Створено `useSuppliersListPageState.ts` (71 рядок) — стан модальних вікон та діалогів.
- Створено `useSuppliersFilterPagination.ts` (46 рядків) — фільтрація та пагінація.
- Створено `useSuppliersCrud.ts` (157 рядків) — завантаження, мутації та квоти.
- Створено `SuppliersEmptyState.tsx` (47 рядків) — порожній стан списку.
- Створено `SuppliersDialogsContainer.tsx` (108 рядків) — контейнер модалок.
- `SuppliersListPage.tsx` оптимізовано до 191 рядка.
- `SuppliersDataTable.tsx` оптимізовано до 120 рядків.

### 🔹 Етап 2: Декомпозиція `AuthContext.tsx`

- Створено `authSessionStorage.ts` (62 рядки) — інкапсуляція читання/запису токенів, перемикання користувачів у SQLite/mockDatabaseDriver.
- `AuthContext.tsx` скорочено до 249 рядків.

### 🔹 Етап 3: Модуляризація `mock-driver.ts`

- Скорочено `mock-driver.ts` з 331 до 184 рядків за рахунок консолідації та тонкої фасадного зв'язку з `mock-suppliers.ts`, `mock-feeds.ts` тощо.

### 🔹 Етап 4: Оптимізація екранів Admin Portal

- Створено `NavigationFeedbackAlerts.tsx` (32 рядки) та `useNavigationPageState.ts` (240 рядків).
- `navigation/page.tsx` скорочено з 301 до 107 рядків.
- Створено `usersTableConfig.ts` (96 рядків).
- `UsersTable.tsx` скорочено з 291 до 221 рядка.

---

## 🧪 4. Результати тестування та верифікації

1. **Desktop Playwright E2E**:
   - `suppliers-drawer-and-single-request.spec.ts` (5/5 PASS)
   - `suppliers-management.spec.ts` (5/5 PASS)
   - `navigation.spec.ts` (6/6 PASS)
   - Всього: **16/16 PASS**
2. **Admin Portal Playwright E2E**:
   - `users-table.spec.ts` (**11/11 PASS**)
3. **TypeScript Typecheck (`tsc --noEmit`)**:
   - `apps/desktop`: **0 errors**
   - `apps/admin-portal`: **0 errors**
4. **i18n Parity Check (`pnpm i18n:check`)**:
   - **100% parity** across all dictionaries.
5. **Code Formatting (`pnpm format`)**:
   - Успішно відформатовано за стандартами Prettier.
