# 🛡️ План системної ремедіації: Хмарна синхронізація, облік медіа та редизайн резервних копій

> **Дата формування:** 13.10.2026  
> **Ініціатори аудиту:** `@agents_review` (Code Review & Architecture), `@agents_qa` (QA & Automation)  
> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.10.2026  
> **Гілка:** `feat/frontend-storage-media`  
> **Цільові модулі:**
>
> - `apps/desktop/src/services/storage.ts`
> - `apps/desktop/src/hooks/useCatalogMediaSync.ts`
> - `apps/desktop/src/hooks/useCatalogMediaStats.ts`
> - `apps/desktop/src/components/cloud/CloudBackupsTab.tsx`
> - `apps/desktop/src/components/cloud/CloudBackupsCards.tsx`
> - `apps/desktop/src/components/cloud/CloudBackupsTable.tsx`
> - `apps/desktop/src/components/layout/Header.tsx`, `Sidebar.tsx`, `NavigationContext.tsx`
> - `apps/desktop/src/i18n/locales/{uk,en}/cloud.json`
> - `apps/desktop/e2e/storage-ui.spec.ts`, `apps/desktop/e2e/storage-backups.spec.ts`

---

## 🧭 1. Детальний аналіз та корінні причини виявлених дефектів

### 🔴 Проблема 1: «Завантажив 57 файлів — показує 0 B, а у хмарних файлах пусто»

1. **Відсутність виклику `confirmStorageUpload` у клієнті**:
   - Функція `uploadDirectToS3` (`apps/desktop/src/services/storage.ts`) запитувала Presigned URL і завантажувала байти у сховище через `PUT`.
   - Проте вона **ніколи не викликала ендпоінт `POST /api/storage/confirm-upload`**.
   - **Наслідок**: Cloudflare R2 / S3 фізично отримав файли, але PostgreSQL база даних бекенду взагалі нічого про них не знала! Таблиця `storage_files` залишалася з 0 записами, а квота `license.usedStorageBytes` залишалася `0 B`.
   - Відповідно, Вкладка 2 («Хмарні файли R2») робить запит `GET /api/storage/files` і показує «У Cloudflare R2 ще немає завантажених файлів», а верхній віджет показує `0 B з 2 GB (0%)` і `0 файлів у Cloudflare R2`.
2. **Не збережений розмір файлів `fileSize` локально**:
   - При імпорті фіду постачальника фотографії додаються як зовнішні посилання без відомого розміру (`fileSize: undefined / 0`).
   - Під час синхронізації в `useCatalogMediaSync.ts` завантажувався `blob`, але `img.fileSize = blob.size` не записувався в об'єкт зображення і не зберігався в локальну БД через `localProductsService.bulkUpsert`.
   - Через це Вкладка 1 показувала «57 фото • 0 B».

---

### 🔴 Проблема 2: «3 вкладка взагалі не зрозуміла, фрази незрозумілі, ціла вкладка не працює»

1. **Технічний сленг розробників замість бізнес-термінів**:
   - Замість зрозумілого менеджерові «Резервна копія каталогу товарів» інтерфейс містив:
     - `AES-256 SQLCipher`
     - `AES-256 та захист ключів через OS Keychain`
     - `Daily Automated Snapshot • 12.4 MB` (захардкоджений фейк)
     - `Хмарне резервне копіювання бази SQLite: Створює зашифрований знімок товарів...`
   - Користувач не розуміє, що таке «SQLCipher», «OS Keychain» або «база SQLite». Йому потрібно розуміти: **як зберегти товари та як відновити каталог, якщо імпорт пішов не так**.
2. **Повна непрацездатність функціоналу (Fake Timeout)**:
   - Кнопка «Створити знімок бази зараз» запускала фіктивний `setTimeout(..., 1200)` і не створювала жодного файлу бекапу.
3. **Чому це пропустив `@agents_qa`**:
   - Попередні E2E тести містили поверхневий smoke-check: перевіряли лише клік по вкладці `getByTestId('cloud-tab-backups')` без перевірки реального збереження бекапу в сховищі, що прямо суперечить правилу **«Zero Superficial Assertions»**.

---

### 🔴 Проблема 3: Розбіжність назв у навігації та заголовках (Скріншот 4)

- **Хлібні крихти**: `Хмарна синхронізація & Бекап`
- **Сайдбар**: `Хмарна синхронізація`
- **Заголовок сторінки**: `Хмарна синхронізація & Медіа`
- **Підзаголовок**: `Cloudflare R2 Storage, Медіа CDN та резервні копії`
- **Рішення**: Уніфікувати всюди єдиний термін: **«Хмарне сховище & Медіа»** (`Cloud Storage & Media`).

---

## 🛠 2. Архітектурне рішення від `@agents_review`

### 1. 100% Хмарний паритет у `apps/desktop/src/services/storage.ts`

- У `uploadDirectToS3` після завершення `PUT` автоматично викликається `confirmStorageUpload`:
  ```ts
  const category =
    folder === 'snapshots'
      ? StorageFileCategory.SYSTEM_BACKUP
      : folder === 'catalogs'
        ? StorageFileCategory.FEED_CATALOG
        : StorageFileCategory.PRODUCT_IMAGE;

  const storageFile = await confirmStorageUpload(accessToken, {
    s3Key,
    category,
    originalName: fileName,
  });
  ```
- Це гарантує, що кожен завантажений файл:
  1. Отримує запис у таблиці `storage_files`.
  2. Враховується у ліцензії `usedStorageBytes` користувача.
  3. Миттєво відображається у Вкладці 2 («Хмарні файли») та у верхньому барі квоти.

### 2. Збереження розміру файлів та статусу в `useCatalogMediaSync.ts`

- При завантаженні кожного зображення:
  ```ts
  img.fileSize = blob.size;
  img.syncStatus = ImageSyncStatus.SYNCED;
  img.cloudUrl = uploadRes.publicUrl;
  img.s3Key = uploadRes.s3Key;
  ```
- Після циклу синхронізації:
  - Викликається `localProductsService.bulkUpsert(products)` для персистентного збереження оновлених `fileSize` та статусів у SQLite / Mock DB.
  - Оновлюється квота через `refreshQuota()` та `stats.refresh()`.

### 3. Повний редизайн Вкладки 3: «Резервні копії каталогу» (`CloudBackupsTab.tsx`)

- **Людська бізнес-термінологія**:
  - Назва: **«Резервне копіювання каталогу»** (товари, ціни, націнки, постачальники).
  - Пояснення: _«Зберігає повний стан вашого каталогу товарів. У разі помилкового імпорту чи збою ви зможете відновити каталог у 1 клік.»_
- **3 зрозумілі інформаційні картки** (винесено в `CloudBackupsCards.tsx`):
  1. **«Поточний каталог»**: відображає реальну кількість товарів та категорій (наприклад, _53 товари • 4 категорії_).
  2. **«Остання резервна копія»**: відображає реальну дату/час останньої збереженої копії з R2 або статус _«Ще не створювалась»_.
  3. **«Хмарний захист»**: відображає статус захищеного хмарного сховища Cloudflare R2.
- **Реальні робочі дії**:
  - **«Створити резервну копію в хмару»**:
    1. Збирає товари, категорії, постачальників та правила націнок із локальної бази.
    2. Формує валідний JSON-снапшот `catalog_backup_YYYY_MM_DD_HHmm.json`.
    3. Завантажує через `uploadDirectToS3` у папку `snapshots/` з підтвердженням `SYSTEM_BACKUP`.
    4. Оновлює список резервних копій та квоту.
  - **«Завантажити файл копії»**: дозволяє зберегти JSON-файл прямо на комп'ютер.
- **Таблиця історії збережених копій** (винесено в `CloudBackupsTable.tsx`):
  - Відображає реальні файли з папки `snapshots/` (отримані з `GET /api/storage/files?folder=snapshots`).
  - Колонки: Назва копії, Дата створення, Розмір файлу, Статус («Збережено в хмарі R2»).
  - Кнопки дій:
    - **«Відновити каталог»** (Restore): завантажує файл копії та імпортує товари назад через `localProductsService.bulkUpsert`.
    - **«Завантажити файл»**.
    - **«Видалити копію»**.

---

## 🧪 3. Результати верифікації від `@agents_qa`

1. **Цільовий тест життєвого циклу медіа та бекапів** (`storage-ui.spec.ts` + `storage-backups.spec.ts`):
   - 7 із 7 тестів успішно пройдено (**7/7 PASS**).
   - Підтверджено повну відсутність технічного сленгу (`SQLCipher`, `OS Keychain`, `SQLite`).
   - Підтверджено коректний розрахунок розмірів, відображення копій, та наявність кнопок створення й завантаження.
2. **Backend E2E тести** (`storage-files-listing.e2e-spec.ts`):
   - 4 із 4 тестів успішно пройдено (**4/4 PASS**).
3. **Мовний паритет**:
   - `pnpm i18n:check` пройшов без помилок (100% паритет UA ⇄ EN).
4. **Статичний аналіз та збірка**:
   - `pnpm lint` — 0 помилок (усі файли < 300 рядків).
   - `pnpm verify:build` — успішно (0 помилок).

---

## 📋 4. Чеклист виконання

- [x] 1. Додати автоматичний `confirmStorageUpload` у `apps/desktop/src/services/storage.ts`.
- [x] 2. Оновити `useCatalogMediaSync.ts`: збереження `fileSize` та виклик `bulkUpsert`.
- [x] 3. Переписати словники локалізації `cloud.json` (UA та EN): видалити весь технічний сленг, додати зрозумілі описи для бекапів.
- [x] 4. Реалізувати оновлений `CloudBackupsTab.tsx`: 3 зрозумілі картки, реальне створення бекапу в `snapshots/`, список копій, відновлення каталогу.
- [x] 5. Синхронізувати заголовки в `Header.tsx`, `Sidebar.tsx`, `NavigationContext.tsx`.
- [x] 6. Оновити Playwright тести (`storage-ui.spec.ts`, `storage-backups.spec.ts`).
- [x] 7. Прогнати цільовий тест та `pnpm verify:build`.
