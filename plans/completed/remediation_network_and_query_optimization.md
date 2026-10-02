# ⚡ План комплексної оптимізації запитів, усунення дублювання та прискорення БД (Frontend & Backend)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 02.10.2026  
> **Мета:** Повна ліквідація надлишкових, каскадних та дублюючих HTTP-запитів на фронтенді, впровадження in-flight Promise Deduplication, переведення бекенду на ефективні SQL-агрегації, впровадження Redis-кешування для рідкозмінюваних даних та оптимізація індексів PostgreSQL.

---

## 🧭 1. Executive Summary & Ключові метрики

| Шар                        | Поточний стан (Проблеми)                                                                                                            | Цільовий стан (Після реалізації)                                                                                         |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **Frontend Network**       | Запити без debounce на пошуку; відсутність in-flight кешу; `locale` у deps перезапитує навігацію; відсутність пагінації у `/users`. | Zero-duplicate requests: 100% захист через debounce (300ms), in-flight deduplication у клієнті, пагіновані запити.       |
| **Backend DB Aggregation** | `findMany` завантажує ВСІ оплачені транзакції в пам'ять JS для підрахунку суми (`reduce`); 4 окремих `count()`.                     | Нативна SQL-агрегація через `prisma.aggregate` та `groupBy` — виконання за <2ms у СУБД без передачі масивів по мережі.   |
| **Caching Layer**          | 0% використання Redis (хоча Redis 7 запущений у контейнері); тарифи та навігація на кожен запит навантажують PostgreSQL.            | L1/L2 Cache у Redis з TTL (тарифи: 1 год, навігація: 1 год) з автоматичною інвалідацією при змінах (Cache Invalidation). |
| **PostgreSQL Indexes**     | Пошук `ILIKE '%term%'` по `licenseKey` без GIN-індексу; важкий N+1 вкладений `include` у `GetUsersListHandler`.                     | GIN-триграмний індекс `licenseKey(ops: raw("gin_trgm_ops"))`; сплощення `select` у списку користувачів.                  |
| **Event Loop Blocking**    | Синхронний рекурсивний `fs.readdirSync` та `fs.statSync` у `GetStorageStatsHandler` блокує Node.js Event Loop.                      | Асинхронний неблокуючий розрахунок через `fs.promises`.                                                                  |

---

## 🎯 2. Детальна класифікація виявлених дефектів

### 🔴 Фаза 1 (Критичні P0): Ліквідація витоків пам'яті та блокувань бекенду

1. **[P0-BE-1] `GetPaymentStatsHandler` — вивантаження всіх транзакцій у пам'ять Node.js**:
   - _Файл:_ `services/backend-api/src/modules/payments/queries/get-payment-stats.handler.ts`
   - _Проблема:_ Викликається `findMany({ where: { status: 'APPROVED' }, select: { amount: true } })` і потім `reduce` в JS. При рості бази це призведе до Out-Of-Memory (OOM) та високого latency.
   - _Виправлення:_ Заміна на `this.prisma.paymentTransaction.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true }, _count: { id: true } })` та `groupBy({ by: ['status'], _count: { id: true } })`.

2. **[P0-BE-2] `GetUsersListHandler` — важкий N+1 вкладений граф без обов'язкового ліміту**:
   - _Файл:_ `services/backend-api/src/modules/users/queries/get-users-list.handler.ts`
   - _Проблема:_ Вкладеність `organizationMemberships -> organization -> owner -> licenses + members -> user`. Завантажує все дерево користувачів без обов'язкового `limit`.
   - _Виправлення:_ Додати обов'язковий дефолтний `limit = 50`, оптимізувати `select` полів без надлишкових глибоких зв'язків.

3. **[P0-BE-3] `GetStorageStatsHandler` — блокування єдиного потоку Node.js (Event Loop)**:
   - _Файл:_ `services/backend-api/src/modules/storage/utils/workspace-disk.ts`
   - _Проблема:_ Рекурсивний синхронний обхід файлової системи (`readdirSync`, `statSync`).
   - _Виправлення:_ Переведення на асинхронні виклики `fs.promises.readdir` та `fs.promises.stat`.

---

### 🟡 Фаза 2 (Високі P1): Фронтенд дедуплікація та ліквідація надлишкових запитів

1. **[P1-FE-1] In-flight Promise Deduplication у `BaseApiClient`**:
   - _Файл:_ `apps/admin-portal/src/lib/api/client.ts`
   - _Проблема:_ Одночасні запити до одного й того самого GET-ендпоінту не поєднуються, створюючи подвійний/потрійний трафік.
   - _Виправлення:_ Додати `Map<string, Promise<any>>` для активних GET-запитів: якщо такий запит уже виконується, повертати активний проміс замість нового `fetch()`.

2. **[P1-FE-2] Зайвий перезапит навігації при перемиканні мови**:
   - _Файл:_ `apps/admin-portal/src/app/(dashboard)/navigation/page.tsx`
   - _Проблема:_ `loadItems` містить `locale` у deps, викликаючи повторний `GET /api/navigation/admin` при кліку на перемикач мови.
   - _Виправлення:_ Видалити `locale` із залежностей `loadItems`, оскільки відповідь бекенду не локалізується на сервері.

3. **[P1-FE-3] Відсутність Debounce та надлишковий запит статистики у `TransactionsPage`**:
   - _Файл:_ `apps/admin-portal/src/app/(dashboard)/transactions/page.tsx`
   - _Проблема:_ Пошук без затримки (кожна буква відправляє новий HTTP-запит). На кожен ввід перезапитується `api.getPaymentStats()`.
   - _Виправлення:_ Додати debounce 300ms для `search`; відокремити початкове завантаження `getPaymentStats` від фільтрації списку транзакцій.

4. **[P1-FE-4] Надлишкове вивантаження ліцензій на головному дашборді**:
   - _Файл:_ `apps/admin-portal/src/app/(dashboard)/page.tsx`
   - _Проблема:_ Викликається `api.getAdminLicenses()`, завантажуючи всі ліцензії, хоча віджет відображає лише 5 останніх.
   - _Виправлення:_ Додати параметри `{ limit: 5 }` у клієнт `api.getAdminLicenses({ limit: 5 })` та контролер.

5. **[P1-FE-5] Пагінація у списку користувачів адмінки**:
   - _Файл:_ `apps/admin-portal/src/app/(dashboard)/users/page.tsx`
   - _Проблема:_ Запит відправляється без пагінації, вивантажуючи всю базу користувачів.
   - _Виправлення:_ Передати `{ limit: 25, offset: page * 25 }` та додати пагінатор у компонент `UsersTable`.

6. **[P1-FE-6] Усунення зайвого ререндеру в десктопному `LicenseContext`**:
   - _Файл:_ `apps/desktop/src/contexts/LicenseContext.tsx`
   - _Проблема:_ Наявність `license` у масиві залежностей `fetchLicense` викликає повторне виконання ефекту після отримання даних.
   - _Виправлення:_ Прибрати `license` із залежностей `useCallback`, спираючись на `token` та `isFetchingRef`.

---

### 🟢 Фаза 3 (Середні P2): Кешування в Redis та індексація БД

1. **[P2-BE-1] Впровадження Redis-кешу для тарифних планів (`/plans`) та навігації (`/navigation`)**:
   - _Модулі:_ `PlansModule`, `NavigationModule`
   - _Рішення:_ Підключити `CacheModule` з Redis-адаптером або легкий сервіс `RedisCacheService`. Кешувати публічні списки планів та навігації (TTL = 3600с). Додати інвалідацію кешу при виклику команд `create/update/delete`.

2. **[P2-BE-2] GIN Trigram індекс для `licenseKey`**:
   - _Файл:_ `services/backend-api/prisma/schema.prisma`
   - _Рішення:_ Додати `@@index([licenseKey(ops: raw("gin_trgm_ops"))], type: Gin)` для швидкого пошуку ліцензій через `contains: term, mode: 'insensitive'`.

3. **[P2-BE-3] Оптимізація `GetUsersStatsHandler` через `groupBy`**:
   - _Файл:_ `services/backend-api/src/modules/users/queries/get-users-stats.handler.ts`
   - _Рішення:_ Об'єднати 3 підрахунки по таблиці `users` в один запит `prisma.user.groupBy({ by: ['role'], _count: { id: true } })`.

---

## 📋 3. Поетапний план впровадження (Execution Steps)

### Етап 1: Бекенд-агрегації та ліквідація важких запитів (P0)

- [x] Оптимізувати `GetPaymentStatsHandler` з використанням `aggregate` та `groupBy`.
- [x] Оптимізувати `GetUsersStatsHandler` через `groupBy`.
- [x] Додати обов'язковий дефолтний `limit = 50` у `GetUsersListHandler`.
- [x] Перевести `workspace-disk.ts` на неблокуючі асинхронні виклики файлової системи.
- [x] Перевірити E2E тести бекенду: `pnpm --filter @smartfeed/backend-api test:e2e` (12/12 сьютів, 150/150 тестів).

### Етап 2: Фронтенд — ліквідація дублів та оптимізація трафіку (P1)

- [x] Додати in-flight Promise Deduplication у `apps/admin-portal/src/lib/api/client.ts`.
- [x] Оптимізувати `DashboardOverviewPage`: додати `limit: 5` до `api.getAdminLicenses`.
- [x] Виправити `NavigationManagementPage`: видалити `locale` із deps `loadItems`.
- [x] Оптимізувати `TransactionsPage`: додати debounce 300ms на пошук, розділити завантаження статистики та таблиці.
- [x] Додати пагінацію у `UsersManagementPage` (`apps/admin-portal`).
- [x] Оптимізувати `apps/desktop/src/contexts/LicenseContext.tsx`.

### Етап 3: База даних та Кешування (P2)

- [x] Додати GIN-триграмний індекс на `licenses.license_key` у `schema.prisma` та згенерувати клієнт.
- [x] Підключити кешування тарифних планів та навігації у Redis (`PlansModule`, `NavigationModule`) з інвалідацією.
- [x] Запустити повну перевірку: `pnpm verify:build` та Playwright E2E тести (Admin: 68/68, Desktop: 91/91).

---

## 🛡️ 4. Критерії готовності (Definition of Done)

1. ✅ Жоден HTTP GET запит не дублюється одночасно на фронтенді (перевірка через `page.on('request') === 1`).
2. ✅ Пошук по таблицях має обов'язковий debounce ≥ 250-300ms без спаму запитами на кожен символ.
3. ✅ Перемикання мови не викликає мережевих запитів до статичних/навігаційних даних.
4. ✅ Статистика платежів рахується в PostgreSQL через `aggregate`, без завантаження списку об'єктів у Node.js.
5. ✅ Всі нові або оптимізовані файли відповідають ліміту <250–300 рядків.
6. ✅ `pnpm verify:build` виконується успішно з 0 помилок.
