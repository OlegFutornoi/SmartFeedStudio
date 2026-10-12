# 🛡️ План системної ремедіації: Хмарне сховище Cloudflare R2 & Медіа-система

> **Дата формування:** 12.10.2026  
> **Ініціатори аудиту:** `@agents_review` (Code Review & Architecture), `@agents_security` (AppSec & Pentest), `@agents_devops` (DevOps & Infrastructure)  
> **Статус:** 🟢 **Успішно реалізовано та верифіковано (Фази 1-4 завершено)**  
> **Гілка:** `feat/frontend-storage-media`  
> **Цільові модулі:** `services/backend-api/src/modules/storage/`, `services/backend-api/src/modules/licenses/`, `apps/desktop/src/components/storage/`, `apps/desktop/src/hooks/useStorageQuota.ts`

---

## 🧭 1. Зведена матриця виявлених дефектів та ризиків

| ID       | Область             | Рівень       | Суть дефекту / Вразливість                                                                                                            | Ризик & Наслідки                                                                                                           |
| :------- | :------------------ | :----------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **R-01** | Архітектура / БД    | **Critical** | Подвійне джерело правди (`licenses.maxStorageGb` vs `tariff_plans.maxStorageGb`) та помилка оператора `??` у `GetStorageQuotaHandler` | Візуальний баг «0 B з 0 GB (0%)» при активному тарифі `GROWTH` (2 GB); блокування сховища                                  |
| **S-01** | AppSec / OWASP API4 | **High**     | Відсутність перевірки розміру файлу та рейт-ліміту при генерації Presigned URL (`generate-presigned-url`)                             | Зловмисник може згенерувати 10,000 посилань і завантажити гігабайти в R2 в обхід квоти (перевірка є лише на етапі confirm) |
| **R-02** | CQRS / Concurrency  | **High**     | TOCTOU Race Condition в `confirm-upload.handler.ts` (перевірка `currentUsed + delta` поза транзакцією/mutex)                          | Паралельні завантаження можуть перевищити ліміт пам'яті (завантаження 5 GB замість 2 GB)                                   |
| **D-01** | DevOps / S3 Client  | **High**     | Роздробленість ініціалізації `S3Client` у 4 хендлерах з різними налаштуваннями `forcePathStyle`                                       | Помилки 403/SignatureDoesNotMatch у Cloudflare R2; дублювання коду                                                         |
| **S-02** | AppSec / Ресурси    | **Medium**   | Завислі незавершені файли в R2 (Dangling Unconfirmed Uploads)                                                                         | Файли завантажуються в R2, але не підтверджуються в API — накопичуються в бакеті та генерують витрати                      |
| **R-03** | Архітектура / S3    | **Medium**   | Відсутність транзакційної цілісності при видаленні файлів (`delete-storage-file`)                                                     | Якщо S3 повертає помилку, запис у БД видаляється, а файл у R2 залишається «сиротою»                                        |
| **U-01** | Frontend / UX       | **Medium**   | Інверсія відображення заблокованого сховища в `StorageQuotaBar` (червоний 100% бар при нульовому тарифі)                              | Паніка користувача через ілюзію аварії/переповнення сховища; невідповідність токенам дизайн-системи                        |
| **D-02** | DevOps / DB Index   | **Medium**   | Відсутність індексів на таблиці `storage_files` для вибірки за статусом і датою експірації                                            | Повільні запити сканування при зростанні бази файлів                                                                       |
| **D-03** | DevOps / Automation | **Low**      | Ручне налаштування CORS для Cloudflare R2 бакета                                                                                      | Ризик зламати завантаження з десктопу (`tauri://localhost`) при розгортанні нового середовища                              |

---

## 🛠 2. Детальний опис проблем та системні рішення

### 🔴 R-01: Подвійне джерело правди та копіювання квот ліцензії

- **Проблема**: Поле `maxStorageGb` існує і в `tariff_plans`, і в `licenses` (`@default(0)`). При призначенні плану поле не копіювалося в `licenses`, а хендлер викликав `license.maxStorageGb ?? tariffPlan.maxStorageGb`. Оскільки `0` не є `null`/`undefined`, значення тарифу (2 GB) ігнорувалося.
- **Рішення**:
  1. Синхронізувати перенесення `maxStorageGb` при створенні та зміні плану в `select-tariff-plan.handler.ts`, `create-license.handler.ts`, `user-created.event-handler.ts`.
  2. У всіх квотних перевірках використовувати канонічний резолвер:
     ```ts
     const maxStorageGb = Number(
       license?.maxStorageGb && license.maxStorageGb > 0
         ? license.maxStorageGb
         : (license?.tariffPlan?.maxStorageGb ?? 0),
     );
     ```
  3. Підготувати міграцію з бекфілом для існуючих записів у PostgreSQL:
     ```sql
     UPDATE licenses l
     SET max_storage_gb = tp.max_storage_gb
     FROM tariff_plans tp
     WHERE l.tariff_plan_id = tp.id
       AND (l.max_storage_gb = 0 OR l.max_storage_gb IS NULL)
       AND tp.max_storage_gb > 0;
     ```

---

### 🔴 S-01: Превентивний захист при генерації Presigned URL (AppSec)

- **Проблема**: Метод `generate-presigned-url` видає URL без перевірки того, чи залишилось у користувача місце в квоті.
- **Рішення**:
  1. Розширити `GeneratePresignedUploadUrlDto`: додати обов'язкове поле `@IsInt() @Min(1) @Max(524288000) expectedSizeBytes: number` (макс 500 MB на файл).
  2. У `GeneratePresignedUploadUrlHandler` перевіряти:
     `currentUsedBytes + expectedSizeBytes <= maxStorageBytes`. Якщо ні — кидати `403 STORAGE_QUOTA_EXCEEDED` ще до видачі посилання.
  3. Додати `@Throttle({ default: { limit: 60, ttl: 60000 } })` на роут генерації URL.

---

### 🔴 R-02: Захист від Race Condition (TOCTOU) через атомарні транзакції

- **Проблема**: Одночасні виклики `confirm-upload` можуть обійти ліміт пам'яті через паралельне читання одного й того самого `license.usedStorageBytes`.
- **Рішення**:
  1. Використовувати атомарний conditional update у Prisma:
     ```ts
     const updated = await tx.$executeRaw`
       UPDATE licenses
       SET used_storage_bytes = used_storage_bytes + ${quotaDelta}
       WHERE user_id = ${userId}
         AND is_active = true
         AND (used_storage_bytes + ${quotaDelta} <= max_storage_gb * 1024 * 1024 * 1024);
     `;
     if (updated === 0) {
       throw new ForbiddenException({ code: 'STORAGE_QUOTA_EXCEEDED', ... });
     }
     ```
  2. Якщо квота не вміщує файл — автоматично видаляти вже завантажений об'єкт з S3, щоб не займати місце.

---

### 🟡 D-01: Централізація `S3StorageService` (DevOps & Clean Code)

- **Проблема**: Створення екземпляра `new S3Client(...)` дублюється у 4 різних файлах, причому з різними параметрами `forcePathStyle` (деінде `true`, деінде `false`).
- **Рішення**:
  1. Створити єдиний сервіс `services/backend-api/src/modules/storage/services/s3-storage.service.ts`:
     - Ін'єктує `ConfigService`.
     - Ініціалізує один екземпляр `S3Client` з єдиною валідацією конфігурації.
     - Експортує методи: `createPresignedUploadUrl()`, `verifyObject()`, `deleteObject()`.
  2. Забезпечити підтримку обох режимів: локальний MinIO (`forcePathStyle: true`) та Cloudflare R2 (`forcePathStyle: false`, `region: 'auto'`).

---

### 🟡 S-02 & D-02: Фоновий клінер завислих файлів (Storage Janitor Worker)

- **Проблема**: Завантаження, які не були підтверджені (`status = 'PENDING_UPLOAD'`), назавжди залишаються в R2.
- **Рішення**:
  1. Додати BullMQ чергу `storage-cleanup` та процесор `storage-janitor.processor.ts`.
  2. Запускати кожні 6 годин (або за розкладом cron):
     - Знаходити записи `storageFile` зі статусом `PENDING_UPLOAD` та `expiresAt < new Date()`.
     - Видаляти об'єкти з Cloudflare R2 бакета.
     - Видаляти відповідні записи з БД.
  3. Додати композитні індекси в `schema.prisma`:
     ```prisma
     @@index([status, expiresAt])
     @@index([userId, status])
     ```

---

### 🟢 U-01: Рефакторинг Frontend UI/UX (Дизайн-система & Стейт-машина)

- **Проблема**: `StorageQuotaBar` фарбував прогрес-бар у червоний колір 100% при `maxStorageGb === 0`.
- **Рішення**:
  1. Впровадити детерміновану стейт-машину в `useStorageQuota`:
     - `STATUS: DISABLED` (тариф без хмари) ➔ прогрес-бар 0%, нейтральний сірий тон, бейдж «Не включено в тариф», спокійна кнопка апгрейду.
     - `STATUS: NORMAL` (0-74%) ➔ смарагдовий колір (`bg-emerald-500`).
     - `STATUS: WARNING` (75-89%) ➔ бурштиновий колір (`bg-amber-500`).
     - `STATUS: CRITICAL` (90-100% або ліміт) ➔ червоний колір (`bg-destructive`).
  2. Додати двомовні ключі в словники `uk` та `en`.

---

## 📅 3. Поетапний план реалізації (Phased Execution Breakdown)

### Фаза 1: Бекенд-архітектура & Централізація S3 (Day 1)

- [x] Створити `S3StorageService` (синглтон, інкапсуляція S3Client).
- [x] Оновити `select-tariff-plan.handler.ts`, `create-license.handler.ts`, `user-created.event-handler.ts` (100% перенос `maxStorageGb`).
- [x] Виправити хендлери `GetStorageQuotaHandler`, `ConfirmUploadHandler`, `RequireStorageQuotaGuard`.

### Фаза 2: AppSec & Захист квот від переповнення (Day 1-2)

- [x] Додати валідацію `expectedSizeBytes` у `generate-presigned-url`.
- [x] Впровадити атомарний conditional update у `confirm-upload` (захист від TOCTOU race conditions).
- [x] Додати індекси в `schema.prisma` (`status, expiresAt`).

### Фаза 3: DevOps, Фонове очищення & Автоматизація (Day 2)

- [x] Оновити BullMQ процесор `storage-gc` для очищення `PENDING_UPLOAD` файлів через `S3StorageService`.
- [x] Налаштувати періодичний розклад очищення кожні 6 год через `StorageSchedulerService`.
- [x] Створити скрипт автоматичного налаштування CORS для Cloudflare R2 (`scripts/ops/r2-cors-setup.sh`).

### Фаза 4: Фронтенд UX, Тести & Верифікація (Day 2-3)

- [x] Завершити рефакторинг `StorageQuotaBar.tsx` та `useStorageQuota.ts` зі стейт-машиною.
- [x] Прогнати Jest E2E тести на квотні ліміти та безпеку (`test/storage-cloud.e2e-spec.ts`).
- [x] Оновити та перевірити Playwright тести (`storage-ui.spec.ts`, `product-images-management.spec.ts`).

---

## 🔒 4. Чеклист приймання (Definition of Done)

1. ✅ При виборі будь-якого тарифу (`STARTER`, `GROWTH`, `PRO`, `ENTERPRISE`) квота `maxStorageGb` коректно синхронізується в `licenses`.
2. ✅ Для тарифу `GROWTH` інтерфейс відображає `0 B з 2 GB (0%)` зі смарагдовим/порожнім індикатором, а не 100% червоним.
3. ✅ Для тарифу `STARTER` (0 GB) інтерфейс спокійно повідомляє «Хмарне сховище не включено в тариф» без хибних аварійних сигналів.
4. ✅ Неможливо завантажити файли понад квоту паралельними запитами (атомарний захист).
5. ✅ Всі тести (`pnpm test:desktop`, Jest E2E) проходять на 100%.
