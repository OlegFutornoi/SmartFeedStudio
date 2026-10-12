# 🎨 Архітектурний План: Фронтенд-Система Хмарного Сховища та Медіа (Cloudflare R2, shadcn UI, CommerceO & NexaCRM)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 12.10.2026  
> **Гілка:** `feat/frontend-storage-media`  
> **Версія:** 1.0.0 (Enterprise Architecture)  
> **Відповідальний агент:** `@agents_frontend`  
> **Цільовий застосунок:** `apps/desktop` (Tauri v2 + React 18) та `apps/admin-portal` (Next.js 14)  
> **Референси та бенчмарки:** [CommerceO Admin](https://shadcn-nextjs-commerceo-admin-template.vercel.app/) · [NexaCRM Analytics](https://shadcn-nextjs-nexacrm-app-template.vercel.app/dashboards/analytics)  
> **Дизайн-система:** `shadcn/ui` + Tailwind CSS (100% Theme Tokens, Zero Off-Scheme Colors)

---

## 🧭 1. Візія та Інженерні Принципи

### 💎 Залізні правила розробки:

1. **Збереження існуючого дизайну**: Жодних нових дисонуючих відтінків (`purple`, `violet`, `pink`). Виключно семантичні CSS-змінні нашої дизайн-системи (`--background`, `--card`, `--muted`, `--primary`, `--border`, `--destructive`, `--secondary`).
2. **Нуль мертвих компонентів (Zero Dead UI)**: Кожен елемент (кнопка, перемикач, прогрес-бар, дропзона, картка) має конкретне функціональне призначення та прив'язаний до реальної дії чи стану в системі. Заборонено додавати непрацюючі декоративні кнопки чи фіктивні лічильники.
3. **Бюджет модульності (Max 250–300 рядків на файл)**: Складна логіка розбивається на окремі цільові субкомпоненти та хуки.
4. **Дедуплікація запитів (`useRef`)**: Залізне дотримання `frontend_network_dedup.md` — строго **1 мережевий запит** на отримання квоти при монтуванні сторінки, захист від повторних викликів при рендерах чи перемиканні мови.
5. **100% Двомовний паритет (UA ⇄ EN)**: Жодного сирого рядка в інтерфейсі, всі тексти через `useTranslation(['storage', 'common'])`.
6. **100% `@/` Path Aliases**: Повна заборона відносних імпортів (`../`).

---

## 🔍 2. Дослідження та Бенчмаркінг (CommerceO & NexaCRM Patterns)

Під час аналізу через Playwright зафіксовано такі ефективні дизайн-рішення:

| №     | Патерн з референсу                           | Де підглянуто                     | Як адаптуємо в SmartFeed Studio (без зміни нашого стилю)                                                                                                                                                                        |
| ----- | -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Embedded Progress Bar у картках метрик**   | CommerceO (`/`)                   | Замість сухого тексту додаємо тонкий анімований `Progress` під числовим значенням обсягу сховища у `StorageQuotaBar` (`420 MB / 10 GB`), із семантичним забарвленням: `emerald` (<75%), `amber` (75-90%), `destructive` (>90%). |
| **2** | **Компактні картки метрик з ієрархією**      | NexaCRM (`/dashboards/analytics`) | Структура картки: Заголовок з іконкою ➔ Головне число ➔ Динамічний тренд / відсоток використання ➔ Прогрес-бар ➔ Контекстна дія (Upgrade або Manage).                                                                           |
| **3** | **Мініатюри товарів у таблицях та дропзона** | CommerceO (Products Table)        | Прев'ю зображення з бейджем статусу прямо в картці товару, плавний ховер з кнопками швидкої дії (перегляд у модалці / заміна фото / видалення).                                                                                 |
| **4** | **Непрозорі фони діалогів (Solid Sticky)**   | Обидва шаблони                    | Шапка та підвал модальних вікон мають 100% непрозорий `bg-card` із тонким `border-b border-border` для ідеальної читабельності при скролі.                                                                                      |
| **5** | **Розділювачі секцій (`Separator`)**         | NexaCRM                           | Чітке візуальне зонування інформації без важких рамок, охайні тонкі лінії `border-border/60`.                                                                                                                                   |

---

## 🧱 3. Декомпозиція Компонентів та Модулів

```text
apps/desktop/src/
├── components/
│   ├── ui/
│   │   └── progress.tsx                    # Сучасний базовий shadcn прогрес-бар (<60 рядків)
│   └── storage/
│       ├── StorageQuotaBar.tsx              # Живий віджет квоти з варіантами 'full' | 'compact' (<180 рядків)
│       ├── UpgradeStoragePromptDialog.tsx  # Модальне вікно пропозиції апгрейду тарифу (<160 рядків)
│       └── DirectPhotoUploader.tsx          # Дропзона з реальним XHR стрімінгом у Cloudflare R2 (<220 рядків)
├── hooks/
│   └── useStorageQuota.ts                   # Хук стану квоти з useRef дедуплікацією (<120 рядків)
├── services/
│   └── storage.ts                          # Розширений клієнт: R2 PUT + confirmUpload + delete (<140 рядків)
└── i18n/locales/
    ├── uk/storage.json                     # 100% переклади українською
    └── en/storage.json                     # 100% переклади англійською
```

---

### Детальна специфікація кожного компонента:

#### 1. `apps/desktop/src/components/ui/progress.tsx` (shadcn Base)

- **Призначення**: Універсальний індикатор прогресу.
- **Особливості**:
  - Побудований на чистому React + Tailwind CSS (або `@radix-ui/react-progress`).
  - Підтримка передачі кастомного класу для індикатора (`indicatorClassName`), що дозволяє динамічно міняти колір (`bg-emerald-500`, `bg-amber-500`, `bg-destructive`).
  - Плавна анімація зміни ширини `transition-all duration-300 ease-out`.

#### 2. `apps/desktop/src/hooks/useStorageQuota.ts` (Джерело правди)

- **Призначення**: Завантаження та кешування даних про квоту користувача з `/api/storage/quota`.
- **Захист від дублів**:
  - `lastFetchedTokenRef` та `isFetchingRef` блокують повторні HTTP-запити при перерендері.
- **Стан та інтерфейс**:
  ```typescript
  export interface StorageQuotaState {
    quota: StorageQuotaDto | null;
    isLoading: boolean;
    error: string | null;
    isLocked: boolean; // true, якщо maxStorageGb === 0 (тариф Starter без хмари)
    isOverQuota: boolean; // true, якщо usedStorageBytes >= maxStorageBytes
    percentUsed: number; // 0–100%
    usedFormatted: string; // '420 MB' або '1.2 GB'
    maxFormatted: string; // '10 GB'
    availableFormatted: string; // '8.8 GB'
    refetch: () => Promise<void>;
  }
  ```

#### 3. `apps/desktop/src/components/storage/StorageQuotaBar.tsx`

- **Призначення**: Візуалізація використання дискового простору.
- **Props**:
  - `variant?: 'full' | 'compact'`
  - `className?: string`
  - `onUpgradeClick?: () => void`
- **Поведінка**:
  - **У варіанті `full` (для `CloudSyncPage`)**:
    - Картка з іконкою `HardDrive`, назвою тарифу (напр. `PRO`), відсотком заповнення.
    - Прогрес-бар з семантичним кольором:
      - 🟢 Зелений (`bg-emerald-500`): `< 75%`
      - 🟡 Бурштиновий (`bg-amber-500`): `75% - 90%`
      - 🔴 Червоний (`bg-destructive`): `> 90%` або `isOverQuota`
    - Текстовий рядок: `Використано 1.2 GB з 10 GB (12%)` та `Залишилось 8.8 GB`.
    - Лічильник файлів: `24 файли в Cloudflare R2`.
    - Якщо тариф Starter (0 GB) або квота > 90% — показує акуратну робочу кнопку `t('storage:upgradeBtn')`, яка веде на `/plans`.
  - **У варіанті `compact` (для `ProductGalleryModal`)**:
    - Однорядковий індикатор: міні-бар + текст `1.2 / 10 GB` + статус бейдж.

#### 4. `apps/desktop/src/components/storage/UpgradeStoragePromptDialog.tsx`

- **Призначення**: Модальне вікно при спробі завантаження фотографій на тарифі без хмарного сховища або при `STORAGE_QUOTA_EXCEEDED`.
- **Поведінка та UI**:
  - Відкривається через `createPortal` у `document.body` з красивим бекдропом `bg-black/50 backdrop-blur-sm`.
  - 100% непрозорий заголовок `bg-card`.
  - Пояснення цінності:
    - ⚡ Швидка віддача фотографій на маркетплейси (Rozetka, Prom, Epicentr) через Cloudflare CDN.
    - 🛡️ 0$ за вихідний трафік (Zero Egress Fees).
    - 📦 Надійне резервне копіювання фото товарів на випадок падіння серверів постачальника.
  - Порівняльна плашка:
    - Поточний тариф: `STARTER (0 GB)`
    - Рекомендований: `PRO (10 GB) — 10 000+ фотографій товарів`
  - Дві чіткі кнопки:
    - `t('common:cancel')` — закриває діалог.
    - `t('storage:upgradeNow')` — закриває діалог та викликає `navigate('/plans')`.

#### 5. `apps/desktop/src/components/storage/DirectPhotoUploader.tsx`

- **Призначення**: Дропзона з прямим завантаженням фото в Cloudflare R2.
- **Props**:
  - `productId?: string`
  - `onSuccess?: (file: StorageFileDto) => void`
  - `onError?: (err: string) => void`
- **Повний цикл обробки подій**:
  1. Користувач перетягує файл або клікає по зоні дропзони.
  2. Перевірка клієнтських лімітів: розмір <= 10 МБ, допустимі формати: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Якщо помилка — тост з локалізованим повідомленням.
  3. Перевірка квоти: якщо `isLocked` або `isOverQuota` — миттєво відкривається `UpgradeStoragePromptDialog`, запит на бекенд не відправляється даремно.
  4. Запит presigned URL: `POST /api/storage/presigned-url`.
  5. Прямий `XMLHttpRequest` PUT в Cloudflare R2 зі зворотним зв'язком у реальному часі `onProgress(percent)` (0% ➔ 100%).
  6. Підтвердження: `POST /api/storage/confirm-upload`.
  7. Виклик `onSuccess(storageFile)`: додавання зображення до товару через `localImagesService.addProductImage` із публічним CDN URL.
  8. Успішний тост: `t('storage:uploadSuccess')`.

---

## 🔗 4. Точки Інтеграції в Існуючі Екрани

### Точка 1: `apps/desktop/src/pages/CloudSyncPage.tsx`

- **Що змінюється**:
  - Заміна статичної картки з hardcoded текстом `"1.4 GB"` на повноцінний віджет `<StorageQuotaBar variant="full" />`.
  - Додавання живої кнопки оновлення квоти, відображення актуальної кількості файлів у бакеті `smartfeed-storage`.

### Точка 2: `apps/desktop/src/components/products/ProductGalleryModal.tsx`

- **Що змінюється**:
  - У шапку модалки поруч із заголовком додається робоча кнопка `"+ Додати фото"`.
  - При кліку розгортається секція з `<DirectPhotoUploader />`.
  - У підвалі модалки відображається компактний індикатор `<StorageQuotaBar variant="compact" />`.
  - Після завантаження фото воно автоматично з'являється у списку мініатюр товару та зберігається в локальний SQLite.

### Точка 3: `apps/desktop/src/components/products/ProductDrawerImages.tsx`

- **Що змінюється**:
  - Додається міні-кнопка завантаження фото прямо з бічної панелі перегляду товару.

---

## 🌐 5. Словники Локалізації (100% UA ⇄ EN)

### `apps/desktop/src/i18n/locales/uk/storage.json`:

```json
{
  "quotaTitle": "Хмарне сховище фотографій",
  "storageUsage": "Використання сховища",
  "usedOf": "Використано {{used}} з {{max}}",
  "available": "Доступно ще {{available}}",
  "filesCount": "Файлів у хмарі: {{count}}",
  "upgradeBtn": "Збільшити обсяг",
  "upgradePromptTitle": "Потрібен тариф з хмарним сховищем",
  "upgradePromptDesc": "Для розміщення фотографій товарів у швидкому Cloudflare CDN потрібен тариф PRO або Enterprise.",
  "upgradeQuotaDesc": "Ви досягли ліміту обсягу хмарного сховища. Звільніть місце або розширте тариф.",
  "upgradeNow": "Перейти до тарифів",
  "cdnFeatureBenefit": "Миттєва віддача фото на маркетплейси без навантаження на сервери",
  "dropzoneTitle": "Перетягніть фото сюди або натисніть для вибору",
  "dropzoneHint": "Підтримуються JPG, PNG, WEBP до 10 МБ",
  "uploading": "Завантаження в Cloudflare R2... {{percent}}%",
  "uploadSuccess": "Фото успішно завантажено та опубліковано",
  "uploadError": "Не вдалося завантажити фото: {{error}}",
  "fileTooLarge": "Файл занадто великий. Максимальний розмір — 10 МБ",
  "invalidFileType": "Непідтримуваний формат файлу. Оберіть JPG, PNG або WEBP",
  "addPhoto": "Додати фото",
  "cdnReady": "CDN Активний"
}
```

### `apps/desktop/src/i18n/locales/en/storage.json`:

```json
{
  "quotaTitle": "Cloud Photo Storage",
  "storageUsage": "Storage Usage",
  "usedOf": "Used {{used}} of {{max}}",
  "available": "Available {{available}}",
  "filesCount": "Files in cloud: {{count}}",
  "upgradeBtn": "Upgrade Storage",
  "upgradePromptTitle": "Cloud Storage Plan Required",
  "upgradePromptDesc": "Cloudflare CDN product photo hosting requires a PRO or Enterprise plan.",
  "upgradeQuotaDesc": "You have reached your storage quota limit. Free up space or upgrade your plan.",
  "upgradeNow": "View Tariff Plans",
  "cdnFeatureBenefit": "High-speed photo delivery to marketplaces with zero server load",
  "dropzoneTitle": "Drag and drop photo here or click to browse",
  "dropzoneHint": "Supports JPG, PNG, WEBP up to 10 MB",
  "uploading": "Uploading to Cloudflare R2... {{percent}}%",
  "uploadSuccess": "Photo uploaded and published successfully",
  "uploadError": "Failed to upload photo: {{error}}",
  "fileTooLarge": "File is too large. Maximum size is 10 MB",
  "invalidFileType": "Unsupported file format. Please choose JPG, PNG or WEBP",
  "addPhoto": "Add Photo",
  "cdnReady": "CDN Active"
}
```

---

## 🧪 6. План Тестування (Playwright UI TDD)

Файл: `apps/desktop/tests/e2e/storage-ui.spec.ts`:

1. **Тест 1: Рендеринг віджету квоти у `CloudSyncPage`**:
   - Перевірка відображення реального значення `used / max`, відсотка прогрес-бару та відсутності хардкоду.
2. **Тест 2: Поява діалогу апгрейду при відсутності квоти**:
   - Емуляція тарифу Starter (0 GB) ➔ спроба завантажити фото ➔ поява `UpgradeStoragePromptDialog`.
   - Перевірка переходу на `/plans` при кліку на "Перейти до тарифів".
3. **Тест 3: Двомовний динамічний переклад UA ⇄ EN**:
   - Перемикання мови через селектор локалей ➔ перевірка перекладу всіх елементів дропзони, квоти та діалогу апгрейду.
4. **Тест 4: Дедуплікація запитів (`requestCount === 1`)**:
   - Перевірка, що ендпоінт `/api/storage/quota` викликається строго 1 раз при завантаженні сторінки без дублів.
