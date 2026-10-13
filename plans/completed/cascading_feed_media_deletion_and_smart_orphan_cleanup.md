# 🧹 План: Каскадне видалення фотографій фіду з R2 & Розумне виявлення сміття в каталозі

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.10.2026  
> **Відповідальні агенти:** `@agents_backend`, `@agents_frontend`, `@agents_qa`, `@agents_review`

---

## 🎯 Проблема та Мета

### Проблема:

1. **Відсутність каскадного видалення з R2 при видаленні фіду**: Коли користувач видаляв фід постачальника, локальні товари видалялися з бази SQLite, але їхні вивантажені фотографії залишалися в Cloudflare R2 та в таблиці `storage_files` PostgreSQL, займаючи квоту та пам'ять.
2. **Хибний статус «Сміття немає» у діалозі очищення**: Хендлер `CleanupOrphansHandler` на бекенді порівнював лише наявність файлу в бакеті S3 з таблицею `storage_files`. Оскільки файли були зареєстровані в PostgreSQL, бекенд вважав їх «активними», не знаючи, що локальні товари в каталозі користувача вже видалені. Як наслідок, діалог показував «0 сміття», хоча 57 фотографій висіли підвішеними.
3. **Громіздкий UI та дублі**: На сторінці `CloudSyncPage` дублювався заголовок (Блок 1), а картка квоти (Блок 2) була надто високою (~140px) і не відображала реальної картини каталогу. Також пагінація за замовчуванням мала відображати 10 рядків.

### Результат реалізації:

1. **Розумне узгодження сміття (Smart Orphan Reconciliation)**: додано `activeKeys?: string[]` (актуальні ключі фотографій із діючого каталогу) в `POST /api/storage/cleanup-orphans`. Будь-який файл у сховищі, якого немає серед `activeKeys` діючих товарів, класифікується як сміття та атомарно видаляється з S3 і `storage_files`, з автоматичним перерахунком використаних байт квоти.
2. **Автоматичне каскадне видалення фото при видаленні фіду**: у `deleteSupplierFeedSource` при видаленні джерела фіду автоматично вилучаються всі фотографії товарів видаленого фіду з Cloudflare R2.
3. **Лаконічний та компактний UI**:
   - Прибрано дублюючий заголовок сторінки (Блок 1).
   - Блок 2 (`StorageQuotaBar`) зменшено до елегантної компактної однорядкової плашки (`px-4 py-2.5`, `rounded-xl`).
   - Пагінацію за замовчуванням встановлено на **10 рядків**.
4. **100% QA верифікація**: додано тести у Jest E2E (`storage-orphans-cleanup.e2e-spec.ts`, 4/4 PASS) та Playwright (`storage-backups.spec.ts`, 4/4 PASS), що підтверджують видалення файлів з R2 при відсутності активних ключів та узгодження квоти.

---

## 🏛 Архітектурний дизайн (4-Layer Defense)

1. **Layer 1 (Shared Contracts)**:
   - Розширено `CleanupOrphansRequestDto` у `@smartfeed/shared` полем `activeKeys?: string[]`.
   - За замовчуванням `limit` у пагінації змінено на `10`.
2. **Layer 2 (Backend CQRS)**:
   - Оновлено `CleanupOrphansDto` (`class-validator` валідація поля `activeKeys`).
   - У `CleanupOrphansHandler`:
     - Якщо передано `activeKeys`: будь-який зареєстрований файл `storageFile` та об'єкт S3 у папці користувача, ключ якого відсутній у `activeKeys` (і не є бекапом `snapshots/`), класифікується як сирота (`orphan`).
     - При `dryRun: false`: видалення з S3, атомарне вилучення записів з PostgreSQL `prisma.storageFile.deleteMany()`, та точний перерахунок квоти `license.usedStorageBytes`.
3. **Layer 3 (Desktop Client & UI)**:
   - **Ліквідація дублюючого блоку 1**: видалено надлишковий заголовок у `CloudSyncPage.tsx`.
   - **Компактний Блок 2 (`StorageQuotaBar`)**: замінено громіздкий блок `p-5` на компактну плашку (`px-4 py-2.5`, `rounded-xl`).
   - **Узгодження у діалозі очищення сміття (`CloudOrphanCleanupDialog.tsx`)**: перед скануванням та очищенням зчитуються активні ключі з `localProductsService`. При 0 товарах передається `activeKeys: []`, і всі 57 файлів ідентифікуються та видаляються.
   - **Каскад у `feed-sources.ts`**: при видаленні фіду з товарами викликається очищення їхніх фото з R2.
4. **Layer 4 (QA Tests)**:
   - Jest E2E: `services/backend-api/test/storage-orphans-cleanup.e2e-spec.ts` — 4/4 PASS.
   - Playwright E2E: `apps/desktop/e2e/storage-backups.spec.ts` — 4/4 PASS.
   - Playwright E2E: `apps/desktop/e2e/storage-ui.spec.ts` — 4/4 PASS.

---

## 📋 План виконання по етапах

- [x] **Етап 1: Контракти у `@smartfeed/shared`**
  - Додати `activeKeys?: string[]` до `CleanupOrphansRequestDtoSchema` у `packages/shared/src/dtos/storage.dto.ts`.
  - Збірка контракту: `pnpm --filter @smartfeed/shared build`.
- [x] **Етап 2: Бекенд CQRS (`services/backend-api`)**
  - Оновити `CleanupOrphansDto` у `services/backend-api/src/modules/storage/dto/cleanup-orphans.dto.ts`.
  - Оновити `CleanupOrphansHandler` у `services/backend-api/src/modules/storage/commands/cleanup-orphans.handler.ts`:
    - Порівняння з `activeKeys`.
    - Видалення з PostgreSQL `storageFile` та коригування квоти при `dryRun: false`.
  - Оновити Jest E2E тест `storage-orphans-cleanup.e2e-spec.ts` (4/4 PASS).
- [x] **Етап 3: Десктоп клієнт (`apps/desktop`)**
  - Прибрати дублюючий заголовок (Блок 1) у `CloudSyncPage.tsx`.
  - Зробити Блок 2 (`StorageQuotaBar.tsx`) компактним в 1 акуратний рядок.
  - Оновити `CloudOrphanCleanupDialog.tsx`: передача `activeKeys` на основі локального каталогу.
  - Оновити `feed-sources.ts`: каскадне видалення фотографій з R2 при видаленні фіду.
  - За замовчуванням встановити пагінацію на 10 рядків.
  - Оновити Playwright E2E тест `storage-backups.spec.ts` (4/4 PASS).
- [x] **Етап 4: Перевірка та лінтер**
  - Запуск `tsc --noEmit` у всіх пакетах (0 помилок).
  - Запуск цільових тестів: Jest + Playwright (100% PASS).
  - Форматування `pnpm format`.
- [x] **Етап 5: UX оптимізація фонового видалення та реактивної синхронізації квоти**
  - **Фонове виконання (`runBackgroundTask`)**: видалення незв'язаних файлів запускається у фоні (`kind: 'CLEANUP_ORPHANS'`), діалог закривається миттєво без блокування користувача.
  - **Кнопка "Закрити" замість "Скасувати"**: у футері діалогу відображається зрозуміла кнопка `Закрити` (`t('common:close')`), як після завершення операції, так і при перегляді результатів сканування.
  - **Реактивне оновлення квоти без "залипання"**: `useStorageQuota` та `useCatalogMediaStats` підключено до `useDataSync(['storage', 'quotas', 'licenses', 'all'])` з примусовою інвалідацією кешу `invalidateStorageQuotaCache()`. Лічильник у віджеті оновлюється автоматично при видаленні фідів/файлів.
  - Додано E2E тест 5 у `storage-backups.spec.ts` на реактивне оновлення квоти. Всі 9 тестів сховища пройшли успішно (9/9 PASS).
