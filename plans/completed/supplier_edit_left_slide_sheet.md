# План: Повноцінна випливаюча панель постачальника (Vendor Details / Commerceo Style) з аватаром у базі даних, нульовими модалками та очищенням легасі-коду

**Статус:** ✅ Реалізовано (100% тестів PASS, 0 помилок tsc, 100% i18n parity)  
**Дата виконання:** 2026-10-15  
**Відповідальні агенти:** `@agents_frontend`, `@agents_backend`

---

## 1. Контекст, візуальний референс та системна мета

- **Візуальний референс:** [Commerceo Vendor Details](https://shadcn-nextjs-commerceo-admin-template.vercel.app/vendor/details).
- **Ключові реалізовані архітектурні вимоги:**
  1. **Повна відмова від модальних вікон («Ніяких модалок»):**
     - Додавання постачальника («Новий постачальник»): бічна панель, що випливає (`SupplierFormSheet`, `side="left"`).
     - Редагування постачальника («Редагувати постачальника»): бічна панель, що випливає зліва направо (`SupplierFormSheet`, `side="left"`).
     - Перегляд інформації постачальника: повнофункціональна панель Vendor Details у стилі Commerceo з верхнім блоком KPI-метрик (товари, категорії, фіди, націнка) та аватаром постачальника.
  2. **Збереження аватарки постачальника в БД:**
     - Підтримка збереження `logoUrl` у базі даних додатку (PostgreSQL через Prisma `suppliers.logo_url`, локальний SQLite SQLCipher через Rust Tauri rusqlite `local_suppliers.logo_url`, in-memory mock driver `mock-suppliers.ts`).
     - Клієнтський вибір файлу аватарки, автоматична компресія/оптимізація в легкий WebP (<256px) через `optimizeAvatarImage`, можливість очищення/видалення (`logoUrl: null`).
     - Візуалізація аватарки у всіх місцях інтерфейсу: таблиця постачальників (`SupplierTableRow`), заголовок панелі Commerceo (`SupplierDrawerHeader`), шапка кабінету постачальника (`SupplierDetailHeader`).
  3. **Очищення застарілого коду (Легасі) та інкапсуляція модуля:**
     - Повне видалення неактуальної папки `apps/desktop/src/components/suppliers/` (11 застарілих файлів).
     - Відв'язка `ImportFeedWizardDialog.tsx` від старого `CreateSupplierDialog`.
     - Видалення старого `SupplierCreateDialog.tsx`.
     - Забезпечення суворої модульній архітектури постачальників у `apps/desktop/src/modules/suppliers/`.

---

## 2. Відповідність системним правилам та інваріантам

- **`CORE-04` (Ліміт рядків <250-300):** Кожен компонент декомпозовано на окремі файли з фокусною відповідальністю:
  - `SupplierAvatar.tsx` (54 рядки): рендеринг аватара з fallback на 2 ініціали.
  - `SupplierAvatarPicker.tsx` (118 рядків): завантаження, оптимізація WebP та скидання фото.
  - `SupplierFormFields.tsx` (233 рядки): контрольовані поля форми (інфо, контакти, валюти, націнка).
  - `SupplierFormSheet.tsx` (201 рядок): випливаюча панель створення та редагування (`side="left"`).
  - `SupplierDrawerHeader.tsx` (152 рядки): розмітка Commerceo з верхніми KPI.
- **`CORE-01` (Шляхи імпортів):** Тільки `@/modules/suppliers/*` або `@smartfeed/shared`. Жодних крос-пакетних відносних імпортів.
- **`FE-04` / `UI-UX` (100% Solid Sticky Header & Footer):** Бічні панелі мають непрозорий фон `bg-background`/`bg-card` та зафіксовані шапку й підвал при прокручуванні форми.
- **`FE-14` & `FE-13` (Інвалідація кешу довідників):** Збереження або редагування постачальника інвалідує кеш постачальників `invalidateSuppliersCache()` та розсилає `emitDataSync(['suppliers', 'quotas'])`.
- **`MOCK-PARITY` (100% паритет даних):** Підтримка `logoUrl` гарантується одночасно в PostgreSQL (`suppliers.logo_url`), SQLite (`local_suppliers.logo_url`) та `mock-suppliers.ts`.

---

## 3. Деталі реалізації

### Етап 1. База даних та контракти (Backend, Shared & SQLite)

1. **Контракти `@smartfeed/shared`:**
   - Оновлено `CreateSupplierDtoSchema` з `logoUrl: z.string().nullable().optional()`, що дозволяє очищувати логотип. Пакет `@smartfeed/shared` успішно скомпільовано.
2. **Backend API (`services/backend-api`):**
   - Prisma модель `Supplier` містить `logoUrl String? @map("logo_url")`.
   - `CreateSupplierHandler`, `UpdateSupplierHandler`, `GetSuppliersHandler`, `GetSupplierByIdHandler` зберігають і повертають `logoUrl`.
3. **Локальна БД Tauri Desktop (Rust SQLite & Mock Driver):**
   - `local_suppliers` містить `logo_url TEXT` у `src-tauri/src/db/suppliers.rs`.
   - `mock-suppliers.ts` надійно зберігає та оновлює `logoUrl`.

---

### Етап 2. Компоненти аватара постачальника

1. **`SupplierAvatar.tsx` (`apps/desktop/src/modules/suppliers/components/common/SupplierAvatar.tsx`):**
   - Підтримує розміри `xs`, `sm`, `md`, `lg`, `xl`.
   - Відображає оптимізоване зображення або плавний бейдж з ініціалами `bg-primary/10 text-primary border-primary/20`.
2. **`SupplierAvatarPicker.tsx` (`apps/desktop/src/modules/suppliers/components/forms/SupplierAvatarPicker.tsx`):**
   - Відображає поточний аватар.
   - Кнопка завантаження фото зі стисненням через `optimizeAvatarImage` (<256px WebP).
   - Кнопка швидкого видалення аватара.

---

### Етап 3. Випливаюча бічна панель створення та редагування (`SupplierFormSheet.tsx`) — НУЛЬ МОДАЛОК

1. **Декомпозиція полів: `SupplierFormFields.tsx` (`apps/desktop/src/modules/suppliers/components/forms/SupplierFormFields.tsx`):**
   - Секція 1: Аватарка (`SupplierAvatarPicker`) + Назва + Системний код.
   - Секція 2: Контактні дані (Телефон, Email, Вебсайт).
   - Секція 3: Валюта та націнка (Базова валюта `UAH/USD/EUR/PLN`, Націнка %, Фіксована націнка ₴).
   - Секція 4: Примітки / Опис умов роботи.
2. **Випливаюча панель `SupplierFormSheet.tsx` (`apps/desktop/src/modules/suppliers/components/forms/SupplierFormSheet.tsx`):**
   - Властивість `side="left"` (випливає зліва направо).
   - Ширина `w-full sm:max-w-md md:max-w-lg lg:max-w-xl`.
   - Автоматично адаптується під створення чи редагування (`isEdit ? 'Редагувати' : 'Новий'`).
   - Фіксовані 100% Solid Sticky Header та Sticky Footer.

---

### Етап 4. Оновлення панелі огляду постачальника (Commerceo Vendor Details Layout)

1. **Верхній блок метрик та шапка (`SupplierDrawerHeader.tsx`):**
   - Інтегровано `SupplierAvatar` (розмір `lg`).
   - Додано верхній рядок з 4 Commerceo-style KPI картками:
     - **Товари:** `supplier.productsCount || 0` (`Package`).
     - **Джерела фідів:** `supplier.activeFeedsCount || 0` (`Rss`).
     - **Категорії:** `supplier.categoriesCount || 0` (`FolderTree`).
     - **Націнка:** `+${defaultMarginPercent}% (${baseCurrency})` (`TrendingUp`).

---

### Етап 5. Очищення легасі-коду та оновлення контейнера діалогів

1. **Видалення застарілих файлів:**
   - Повністю видалено папку `apps/desktop/src/components/suppliers/` (11 неактуальних файлів).
   - Видалено `apps/desktop/src/modules/suppliers/components/forms/SupplierCreateDialog.tsx`.
2. **Оновлення `ImportFeedWizardDialog.tsx`:**
   - Переведено на використання модульного `SupplierFormSheet`.
3. **Оновлення `SuppliersDialogsContainer.tsx`:**
   - Повністю видалено модалку `SupplierCreateDialog`.
   - Підключено `SupplierFormSheet` для створення та редагування.
4. **Оновлення `SupplierTableRow.tsx` та `SupplierDetailHeader.tsx`:**
   - Використано єдиний `SupplierAvatar`.

---

### Етап 6. Автоматизоване E2E тестування та валідація

1. **Створено тест `apps/desktop/e2e/suppliers-slide-sheet.spec.ts` (3/3 PASS, 4.6s):**
   - ✅ Додавання постачальника відкриває саме Slide-Over Sheet (side=left), а не модальне вікно Dialog.
   - ✅ Редагування постачальника відкриває Slide-Over Sheet з передзаповненими даними та аватаром.
   - ✅ Панель деталей постачальника містить Commerceo-style шапку з аватаром та верхніми KPI-метриками.
2. **Перевірка регресій:**
   - `suppliers-management.spec.ts` (5/5 PASS, 4.7s)
   - `network-dedup.spec.ts` (3/3 PASS, 4.9s)
   - `pnpm i18n:check` (✅ 100% parity)
   - `tsc --noEmit` across `@smartfeed/desktop`, `@smartfeed/backend-api`, `@smartfeed/admin-portal` (✅ 0 помилок).
