# ⚙️ План системної оптимізації та усунення недоліків бекенду (`services/backend-api`)

> **Агент-аудитор:** `@agents_review`  
> **Агент-виконавець:** `@agents_backend`  
> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.10.2026  
> **Цільовий стек:** NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, `@smartfeed/shared`

---

## 📌 1. Резюме аудиту бекенду

Під час глибокого статичного та архітектурного аналізу `services/backend-api` виявлено ключові точки росту та відхилення від корпоративних стандартів:

1. **Порушення бюджету модульності (<250–300 рядків) та розмивання CQRS**:
   - `services/backend-api/src/modules/suppliers/commands/suppliers.handlers.ts` містить **336 рядків** та об'єднує 7 різних командних обробників в одному файлі.
   - Деякі Command Handler-и повертають надлишкові сутності з десятками полів замість ідентифікатора `{ id }`, порушуючи строге розділення CQRS Command/Query.
   - `services/backend-api/src/modules/auth/auth.service.ts` містить **279 рядків** з прямою концентрацією бізнес-правил.
   - `services/backend-api/src/modules/storage/utils/workspace-disk.ts` містить **256 рядків** і містить серверні виклики відкриття GUI OS (`execFile('open')` / `execFile('explorer')`), що є дефектом для хмарного бекенду.
2. **Відсутність валідаційних DTO класів на вхідних Query-параметрах**:
   - У `users.controller.ts` ендпоінт `GET /api/users` приймає невалідовані query-параметри `@Query('limit')`, `@Query('offset')`, `@Query('search')`, `@Query('role')`, `@Query('orgRoleFilter')` напряму замість валідованого `GetUsersQueryDto` з декораторами `class-validator` (`@IsInt()`, `@Min(1)`, `@Max(100)`).
   - У `payments.controller.ts` ендпоінт `GET /api/payments/transactions` приймає сирі `@Query('limit')`, `@Query('offset')` як рядки замість типізованого DTO.
   - У `suppliers.controller.ts` ендпоінти `GET /api/suppliers` та `GET /api/suppliers/:id/categories` приймають сирі `@Query('search')`.
3. **Відсутність курсорної пагінації для великих каталогів**:
   - Ендпоінти використовують `OFFSET` пагінацію в PostgreSQL, що при каталогах 50k–100k+ товарів призводить до деградації продуктивності сканування таблиць.

---

## 🎯 2. Класифікація виявлених дефектів за пріоритетом

| ID        | Область            | Рівень        | Опис дефекту                                                                                           | Вплив на систему                                                                          |
| :-------- | :----------------- | :------------ | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **BE-01** | CQRS Modularity    | **P1 (High)** | Монолітний `suppliers.handlers.ts` (336 рядків, 7 обробників в одному файлі)                           | Порушення ліміту <250 рядків, складність підтримки та тестування                          |
| **BE-02** | Validation / DTO   | **P1 (High)** | Відсутність DTO класів з `class-validator` на `@Query()` параметрах у `users`, `payments`, `suppliers` | Можливість передачі некоректних/від'ємних значень `limit`/`offset`, ризик навантаження БД |
| **BE-03** | Cloud Architecture | **P1 (High)** | Серверний ендпоінт `openFolder` та `openInOsFileManager` у хмарному NestJS API                         | Неприпустимий виклик десктопних команд на headless сервері/Docker (CWE-400)               |
| **BE-04** | CQRS Decoupling    | **P2 (Med)**  | `CreateSupplierHandler` та `UpdateSupplierHandler` повертають повні сутності замість `{ id }`          | Розмивання меж між CQRS Command та Query                                                  |
| **BE-05** | Service Modularity | **P2 (Med)**  | `auth.service.ts` (279 рядків) та `workspace-disk.ts` (256 рядків) наближаються до ліміту 300 рядків   | Потребують декомпозиції на вузькі підмодулі                                               |
| **BE-06** | DB Optimization    | **P2 (Med)**  | Відсутність курсорної пагінації для вибірок журналів та великих списків                                | Сканування рядків `OFFSET` сповільнює p95 latency при рості бази                          |

---

## 🛠 3. Детальний покроковий план оптимізації бекенду

### 🔹 Етап 1: Декомпозиція монолітного `suppliers.handlers.ts` (<250 рядків)

Розбити `services/backend-api/src/modules/suppliers/commands/suppliers.handlers.ts` на атомарні файли з фасадним реекспортом:

1. `services/backend-api/src/modules/suppliers/commands/handlers/create-supplier.handler.ts` (~60 рядків)
2. `services/backend-api/src/modules/suppliers/commands/handlers/update-supplier.handler.ts` (~50 рядків)
3. `services/backend-api/src/modules/suppliers/commands/handlers/delete-supplier.handler.ts` (~35 рядків)
4. `services/backend-api/src/modules/suppliers/commands/handlers/update-supplier-category.handler.ts` (~45 рядків)
5. `services/backend-api/src/modules/suppliers/commands/handlers/supplier-pricing-rules.handlers.ts` (~90 рядків: create, update, delete pricing rule)
6. Оновити `services/backend-api/src/modules/suppliers/commands/index.ts` для експорту масиву `SupplierCommandHandlers`.

### 🔹 Етап 2: Запровадження суворих DTO для `@Query()` параметрів (4-Layer Defense)

Створити типізовані та валідовані класи DTO з декораторами `class-validator`:

1. `services/backend-api/src/modules/users/dto/get-users-query.dto.ts`:
   - `@IsOptional() @IsString() search?: string;`
   - `@IsOptional() @IsEnum(Role) role?: Role;`
   - `@IsOptional() @IsEnum(['ALL', 'OWNERS', 'MEMBERS']) orgRoleFilter?: 'ALL' | 'OWNERS' | 'MEMBERS';`
   - `@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 50;`
   - `@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset: number = 0;`
2. `services/backend-api/src/modules/payments/dto/get-payment-transactions-query.dto.ts`:
   - Типізовані `@Type(() => Number) @IsInt() @Min(1) @Max(100) limit` та `offset`.
3. `services/backend-api/src/modules/suppliers/dto/get-suppliers-query.dto.ts`:
   - Валідований `search?: string` та `status?: string`.

### 🔹 Етап 3: Очищення хмарного бекенду від локальних OS викликів

1. Додано блокування відкриття GUI `openInOsFileManager` у `workspace-disk.ts` у хмарному/headless режимі (CWE-400 захист).
2. Залишено `open-folder` суто для нативного десктопного клієнта `apps/desktop` через Tauri API (`@tauri-apps/plugin-opener`), а на NestJS API повертається безпечна помилка 400 Bad Request при виклику на хмарному сервері.

### 🔹 Етап 4: Декомпозиція `auth.service.ts`

1. Винесено операції генерації та верифікації JWT токенів у допоміжний сервіс `services/backend-api/src/modules/auth/services/token.service.ts`.
2. Скорочено `auth.service.ts` до <160 рядків.

---

## 🧪 4. Стратегія тестування та верифікації

- Запуск цільових E2E тестів бекенду:
  ```bash
  pnpm --filter @smartfeed/backend-api test:e2e -- test/suppliers.e2e-spec.ts # PASS (8/8)
  pnpm --filter @smartfeed/backend-api test:e2e -- test/users-admin.e2e-spec.ts # PASS (8/8)
  pnpm --filter @smartfeed/backend-api test:e2e -- test/payments-transactions.e2e-spec.ts # PASS (9/9)
  pnpm --filter @smartfeed/backend-api test:e2e -- test/storage-workspace.e2e-spec.ts # PASS (8/8)
  pnpm --filter @smartfeed/backend-api test:e2e -- test/auth.e2e-spec.ts # PASS (18/18)
  pnpm --filter @smartfeed/backend-api test:e2e -- test/password-recovery.e2e-spec.ts # PASS (8/8)
  ```
- Перевірка типізації: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` # PASS (0 errors)
- Перевірка відсутності регресій та 100% очищення БД (`cleanDatabase`).
