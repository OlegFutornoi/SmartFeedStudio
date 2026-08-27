# 🛡️ Архітектурне Рев'ю: Контроль Доступів (RBAC), Мульти-Тенантність та Захист Адмін-Панелі

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 27.08.2026  
> **Автор:** Antigravity Agent  
> **Зв'язані документи:**
>
> - [`plans/company_registration_and_team_access.md`](file:///Users/oleg/AQA/SmartFeedStudio/plans/company_registration_and_team_access.md)
> - [`plans/organizations_and_team_seats.md`](file:///Users/oleg/AQA/SmartFeedStudio/plans/organizations_and_team_seats.md)

---

## 🎯 1. Головна Мета та Знайдені Прогалини

Користувач звернув увагу на критичну вразливість: **звичайний зареєстрований користувач (`role: 'USER'`) зміг успішно увійти в адмін-кабінет (`apps/admin-portal`) та переглядати конфіденційні дані**.

### 🔍 Детальний Аудит Системи (Root Cause Analysis):

1. **Бекенд `UsersController` (`/api/users`)**:
   - На ендпоінтах `GET /api/users` (список усіх користувачів системи) та `GET /api/users/stats` (глобальна статистика) використовувався **тільки `JwtAuthGuard`**.
   - **Був відсутній `RolesGuard`** та анотація `@Roles(Role.ADMIN, Role.SUPER_ADMIN)`.
   - Будь-який валідний JWT токен звичайного користувача надавав повний доступ до бази користувачів та статистики.
2. **Некоректний E2E тест бекенду (`test/users.e2e-spec.ts`)**:
   - Тест реєстрував звичайного користувача через `/api/auth/register` (роль `USER`) і стверджував, що той має отримувати `200 OK` на `/api/users`.
   - Тест **не перевіряв рольову ізоляцію** і не тестував очікуване повернення `403 Forbidden` для не-адмінів.
3. **Фронтенд Адмін-Панелі (`apps/admin-portal`)**:
   - `AuthContext.tsx`: метод `login()` зберігав токен і робив редирект на `/` без перевірки ролі (`res.user.role`).
   - `AuthGuard.tsx`: перевіряв лише наявність сесії `if (!user) router.push('/login')`, але взагалі не перевіряв роль `user.role`.
4. **Відсутність дефолтного Super Admin у базі**:
   - У формі входу адмінки є кнопка "Швидке заповнення" (`admin@smartfeed.studio` / `AdminPassword123!`), але в `seed.ts` ініціалізувався лише `admin@gmail.com`.
   - Поточна база даних після тестів не містить збереженого супер-адміністратора.

---

## 🏛 2. Повна Карта Доступів Бекенду (RBAC & Multi-Tenancy Matrix)

| Модуль       | Ендпоінт                              | Метод  | Необхідна Роль / Доступ         | Тенантність (Multi-Tenancy)                    |             Поточний Стан             | Необхідна Дія                    |
| :----------- | :------------------------------------ | :----: | :------------------------------ | :--------------------------------------------- | :-----------------------------------: | :------------------------------- |
| **Auth**     | `/api/auth/register`                  |  POST  | Public                          | Створює User + Org[OWNER] + STARTER            |              ✅ Захищено              | Залишити як є                    |
| **Auth**     | `/api/auth/login`                     |  POST  | Public                          | Перевірка паролю, видача JWT                   |              ✅ Захищено              | Залишити як є                    |
| **Auth**     | `/api/auth/me`                        |  GET   | `USER`, `ADMIN`, `SUPER_ADMIN`  | Повертає профіль поточного користувача         |              ✅ Захищено              | Залишити як є                    |
| **Auth**     | `/api/auth/change-password`           |  POST  | Будь-який авторизований         | Зміна паролю ТІЛЬКИ для `req.user.id`          |              ✅ Захищено              | Залишити як є                    |
| **Users**    | `/api/users`                          |  GET   | **`ADMIN`, `SUPER_ADMIN`**      | Вся база користувачів                          | ❌ **ВРАЗЛИВІСТЬ** (немає RolesGuard) | **Додати RolesGuard + 403 тест** |
| **Users**    | `/api/users/stats`                    |  GET   | **`ADMIN`, `SUPER_ADMIN`**      | Глобальна статистика платформи                 | ❌ **ВРАЗЛИВІСТЬ** (немає RolesGuard) | **Додати RolesGuard + 403 тест** |
| **Licenses** | `/api/licenses/my`                    |  GET   | Авторизований                   | Тільки ліцензія користувача / його компанії    |              ✅ Захищено              | Залишити як є                    |
| **Licenses** | `/api/licenses/select-plan`           |  POST  | Авторизований                   | Апгрейд для поточної компанії                  |              ✅ Захищено              | Залишити як є                    |
| **Licenses** | `/api/licenses/admin`                 |  GET   | **`ADMIN`, `SUPER_ADMIN`**      | Реєстр усіх ліцензій платформи                 |              ✅ Захищено              | Залишити як є                    |
| **Licenses** | `/api/licenses/assign`                |  POST  | **`ADMIN`, `SUPER_ADMIN`**      | Призначення плану іншому користувачу           |              ✅ Захищено              | Залишити як є                    |
| **Plans**    | `/api/plans`                          |  GET   | Public                          | Публічні ціни та тарифи                        |              ✅ Захищено              | Залишити як є                    |
| **Plans**    | `/api/plans/admin`                    |  GET   | **`ADMIN`, `SUPER_ADMIN`**      | Всі плани (включаючи приховані)                |              ✅ Захищено              | Залишити як є                    |
| **Plans**    | `/api/plans` (POST/PATCH/DEL)         |  ANY   | **`ADMIN`, `SUPER_ADMIN`**      | CRUD операції над тарифами                     |              ✅ Захищено              | Залишити як є                    |
| **Nav**      | `/api/navigation`                     |  GET   | Авторизований                   | Фільтрація за ролями та тарифом користувача    |              ✅ Захищено              | Залишити як є                    |
| **Nav**      | `/api/navigation/admin` (і CRUD)      |  ANY   | **`ADMIN`, `SUPER_ADMIN`**      | Керування структурою меню                      |              ✅ Захищено              | Залишити як є                    |
| **Orgs**     | `/api/organizations`                  |  GET   | Авторизований                   | **Тільки організації, де користувач є членом** |             ✅ Ізольовано             | Залишити як є                    |
| **Orgs**     | `/api/organizations/:id`              |  GET   | Член організації                | **403 якщо користувач не є членом**            |             ✅ Ізольовано             | Залишити як є                    |
| **Orgs**     | `/api/organizations/:id/members`      |  GET   | Член організації                | **403 якщо користувач не є членом**            |             ✅ Ізольовано             | Залишити як є                    |
| **Orgs**     | `/api/organizations/:id`              | PATCH  | **`OWNER`, `ADMIN`** воркспейсу | **403 для MEMBER та сторонніх**                |             ✅ Ізольовано             | Залишити як є                    |
| **Orgs**     | `/api/organizations/:id/members`      |  POST  | **`OWNER`, `ADMIN`** воркспейсу | **403 для MEMBER та при перевищенні квоти**    |             ✅ Ізольовано             | Залишити як є                    |
| **Orgs**     | `/api/organizations/:id/members/:mId` | DELETE | **`OWNER`, `ADMIN`** воркспейсу | **403 для MEMBER, не можна видалити OWNER**    |             ✅ Ізольовано             | Залишити як є                    |
| **Storage**  | `/api/storage/presigned-url`          |  POST  | Авторизований з ліцензією       | Ключ S3 генерується з префіксом `userId`       |              ✅ Захищено              | Додати тенантність               |

---

## 📋 3. Поетапний План Виправлення та Захисту

### Етап 1. Захист Бекенду (`services/backend-api`)

1. **`UsersController` ([services/backend-api/src/modules/users/users.controller.ts](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/users/users.controller.ts))**:
   - Імпортувати `RolesGuard` та `@Roles`.
   - Захистити `GET /api/users` та `GET /api/users/stats` декораторами:
     ```typescript
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(Role.SUPER_ADMIN, Role.ADMIN)
     ```
2. **Оновлення E2E тестів бекенду ([services/backend-api/test/users.e2e-spec.ts](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/test/users.e2e-spec.ts))**:
   - Додати негативні тести: звичайний користувач `USER` при спробі викликати `GET /api/users` та `GET /api/users/stats` отримує **`403 Forbidden`**.
   - Для позитивних перевірок створення даних створити адміністратора або підвищити роль користувача до `SUPER_ADMIN`.

---

### Етап 2. Захист Фронтенду Адмін-Панелі (`apps/admin-portal`)

1. **`AuthContext.tsx` ([apps/admin-portal/src/contexts/AuthContext.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/contexts/AuthContext.tsx))**:
   - У методі `login()` перевіряти роль користувача:
     ```typescript
     if (res.user.role !== Role.ADMIN && res.user.role !== Role.SUPER_ADMIN) {
       api.setToken(null);
       throw new Error('access_denied_admin_only');
     }
     ```
   - У методі `fetchCurrentUser()` при завантаженні профілю: якщо `profile.role !== Role.ADMIN && profile.role !== Role.SUPER_ADMIN`, скидати сесію `logout()` та перенаправляти на `/login`.
2. **`AuthGuard.tsx` ([apps/admin-portal/src/components/auth/AuthGuard.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/auth/AuthGuard.tsx))**:
   - Перевіряти не лише наявність `user`, а й права:
     ```typescript
     if (!isLoading && user && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
       router.push('/login?error=access_denied');
     }
     ```
3. **Локалізація помилок ([i18n/locales/uk/errors.json](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/i18n/locales/uk/errors.json) та [en/errors.json](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/i18n/locales/en/errors.json))**:
   - Додати ключ `access_denied_admin_only`: _"Доступ заборонено. Вхід дозволено лише адміністраторам системи."_ / _"Access denied. Restricted to administrators only."_
4. **Playwright E2E тести адмінки ([apps/admin-portal/e2e/auth.spec.ts](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/e2e/auth.spec.ts))**:
   - Додати тест: спроба входу користувача з роллю `USER` відхиляється, користувач не пускається в дашборд, а на екрані з'являється червоне сповіщення про відсутність прав адміністратора.

---

### Етап 3. Додавання єдиного Super Admin (Власника платформи)

1. **Створення та запуск сідера для Super Admin**:
   - Налаштувати обліковий запис супер-адміна власника:
     - **Email:** `admin@admin.com`
     - **Пароль:** Встановлюється через `ADMIN_PASSWORD` в `.env` (або `pnpm admin:set`)
     - **Роль:** `SUPER_ADMIN`
     - **Ліцензія:** Відсутня (Супер-адмін є господарем/хостом системи і не є клієнтом)
   - Повністю видалено всі тестові/фейкові акаунти (`admin@gmail.com`, `admin@smartfeed.studio`) та їхні фіктивні ліцензії.
   - Оновлено `prisma/seed.ts` та `prisma/set-admin.ts`.
   - Видалено кнопку швидкого заповнення з хардкодом паролів з фронтенду логіну.

---

## 🧪 4. План Верифікації (Definition of Done)

1. **Бекенд тести**: `pnpm --filter @smartfeed/backend-api test:e2e` (всі тести проходять, включаючи 403 перевірки для `GET /api/users` та `GET /api/users/stats`).
2. **Адмін тести**: `pnpm test:admin` (всі тести проходять, включаючи блокування звичайного користувача).
3. **Десктоп тести**: `pnpm test:desktop` (29/29 проходять).
4. **Перевірка бази даних**: скрипт підтверджує наявність виключно одного супер-адміна `admin@admin.com` з роллю `SUPER_ADMIN` без ліцензій у PostgreSQL.
5. **Типізація та форматування**: `tsc --noEmit` без помилок, `pnpm format`.
