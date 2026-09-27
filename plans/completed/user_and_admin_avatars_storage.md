# 📋 SmartFeed Studio — Впровадження аватарів для Користувачів та Адміністратора (Локальна БД vs Сервер)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 27.09.2026  
> **Аудитор & Архітектор:** `agents_frontend` & `agents_backend`  
> **Цільові додатки:** `apps/desktop` (Local SQLite), `apps/admin-portal` (Next.js 14), `services/backend-api` (PostgreSQL), `packages/shared`  
> **Відповідність стандартам:** [`.agents/agents_frontend.md`](../../.agents/agents_frontend.md), [`.agents/rules/rules.md`](../../.agents/rules/rules.md), [`.agents/rules/postgres_skills.md`](../../.agents/rules/postgres_skills.md)

---

## 🎯 1. Архітектурне завдання та розділення сховищ

Користувач поставив чітку вимогу:

> «npx shadcn@latest add avatar встанови аватари щоб можна було і адміну і користувачам аватари добавляти: адмін зберігає в базі на сервері, а користувач в базі локально»

### 🏛 Концептуальне розділення Native vs Cloud:

1. **Адміністратор (`apps/admin-portal` + `services/backend-api`)**:
   - Аватар зберігається **в хмарній базі даних PostgreSQL** (стовпчик `avatar_url` у таблиці `users`).
   - Керування та зміна аватара здійснюється в розділі `Налаштування` (`/settings`) через ендпоінт `PATCH /auth/avatar`.
   - Зображення аватара передається та зберігається в оптимізованому форматі (Base64/Data URI або збережене посилання) з обмеженням розміру (до 2MB) та валідацією типу MIME (`image/png`, `image/jpeg`, `image/webp`).
2. **Користувач Desktop (`apps/desktop`)**:
   - Аватар зберігається **локально в нативній базі даних** додатку (Local SQLite / SQLCipher у таблиці `local_user_profiles`), не навантажуючи сервер та зберігаючи повну автономність офлайн-режиму клієнта.
   - Кешування у `localStorage` та швидке відновлення в `AuthContext`.
   - Зміна аватара в `Налаштуваннях` (`/settings` або випадаючому меню профілю) з попереднім переглядом.

---

## 🧩 2. Компоненти Дизайн-Системи (shadcn `@shadcn/avatar`)

Використовується офіційна бібліотека `@radix-ui/react-avatar`:

- Встановлено залежність `@radix-ui/react-avatar` в `apps/admin-portal` та `apps/desktop`.
- Єдині компоненти `components/ui/avatar.tsx`:
  - `Avatar`: круглий контейнер з `overflow-hidden border border-border bg-muted`.
  - `AvatarImage`: адаптивне зображення з плавною загрузкою.
  - `AvatarFallback`: текстові ініціали користувача з акцентним фоном (`bg-primary/20 text-primary`), якщо фото відсутнє або завантажується.

---

## 🛠 3. Поетапний план реалізації

### Етап 1: Спільні контракти (`packages/shared`)

1. Оновити інтерфейс `UserProfile`:
   ```typescript
   export interface UserProfile {
     id: string;
     email: string;
     fullName?: string | null;
     role: Role;
     avatarUrl?: string | null; // Нове поле
     ...
   }
   ```
2. Створити DTO `UpdateAvatarDto`:
   ```typescript
   export class UpdateAvatarDto {
     @IsString()
     @IsNotEmpty()
     avatarUrl!: string;
   }
   ```
3. Виконати збірку: `pnpm --filter @smartfeed/shared build`.

### Етап 2: Бекенд API та база даних PostgreSQL (`services/backend-api`)

1. `schema.prisma`:
   - Додати поле `avatarUrl String? @map("avatar_url")` у модель `User`.
   - Виконати синхронізацію: `pnpm --filter @smartfeed/backend-api exec prisma db push && pnpm --filter @smartfeed/backend-api exec prisma generate`.
2. CQRS шар:
   - Створити команду `UpdateUserAvatarCommand` та хендлер `UpdateUserAvatarHandler`.
   - Оновити `UsersModule` та `AuthController`: ендпоінт `PATCH /auth/avatar` із захистом `JwtAuthGuard`.
3. Оновити `cleanDatabase` у тестах, якщо необхідно.

### Етап 3: Локальна база даних Desktop Client (`apps/desktop`)

1. Створити сервіс локального збереження аватара:
   - В `sqlite.ts` або `services/localUserProfile.ts`: збереження пари `userId -> avatarUrl` у локальній SQLite базі.
2. Інтеграція з `AuthContext`:
   - При старті та зміні користувача читати локальний аватар для поточного `user.id`.
   - Метод `updateLocalAvatar(avatarUrl: string)` для миттєвого збереження локально та оновлення стейту.

### Етап 4: UI інтерфейс вибору та зміни аватара (Desktop & Admin)

1. Створити субкомпонент `AvatarUploadCard.tsx` (<200 рядків):
   - Поточний аватар (великий прев'ю 80x80 або 96x96).
   - Прихований `input type="file" accept="image/*"`.
   - Кнопка «Змінити фото» та кнопка «Видалити фото».
   - Валідація розміру (<2MB) та конвертація в WebP/JPEG data URL для надійності.
2. Інтегрувати в:
   - `apps/admin-portal/src/app/(dashboard)/settings/page.tsx` (збереження на сервері через `api.updateAvatar`).
   - `apps/desktop/src/pages/SettingsPage.tsx` (збереження в локальній базі).
   - Оновити відображення у `Header` та `SidebarUserProfile` (відображення `AvatarImage` або `AvatarFallback`).

### Етап 5: Автотести та Верифікація

1. Запуск Jest E2E на бекенді: `pnpm --filter @smartfeed/backend-api test:e2e`.
2. Запуск Playwright на десктопі: `pnpm test:desktop`.
3. Запуск Playwright в адмінці: `pnpm test:admin`.
4. Перевірка статичної типізації: `tsc --noEmit` у всіх пакетах.

---

## 🔒 4. Протокол безпеки та життєвого циклу (Strict Hold)

Згідно з регламентом [`.agents/rules/plans_lifecycle.md`](../../.agents/rules/plans_lifecycle.md) та `agents_frontend`:  
**Агент ЗУПИНЯЄТЬСЯ і НЕ розпочинає внесення змін у код до отримання явної команди користувача на виконання плану.**
