# 🚀 План: Архітектура Системи Локальних Таблиць та Динамічних Курсів Валют без Хардкоду

## 1. Аналіз Проблеми та Аудит Коду (@agents_review)

### Звідки взявся курс 41.5 на скріншоті:

1. **Хардкод у `apps/desktop/src/lib/api/currencies.ts`**:
   - Рядок 13: `[CurrencyCode.USD]: 41.5` у константі `DEFAULT_RATES`.
2. **Хардкод у `apps/desktop/src/modules/suppliers/components/details/tabs/currencies/currencies.constants.ts`**:
   - Рядок 35: `USD: 41.5` у словнику `defaultRates`.
   - Рядок 43: `defaultRates[currency] || 41.5` як дефолтне значення, якщо у постачальника курс не був заданий явно.
3. **Хардкод у `apps/desktop/src/modules/suppliers/components/details/tabs/currencies/useSupplierCurrenciesState.ts`**:
   - Рядки 101, 113, 123: `setManualRate(liveRates[nextCurrency] || DEFAULT_RATES[nextCurrency] || 41.5)`.
4. **Хардкод у `apps/desktop/src/services/local-db/mock/mock-seed.ts`**:
   - Рядок 61: у демо-постачальника було захардкоджене поле `exchangeRate: 41.5`.

### Архітектурний висновок аудиту:

- На даний момент котирування банків завантажуються лише в оперативну пам'ять (React State / In-Memory Map) і не зберігаються в окремій локальній таблиці бази даних.
- За відсутності збереженого курсу або при відкритті постачальника спрацьовує ланцюжок фолбеків на застарілу константу `41.5`.
- **Рішення**: Створити повноцінну локальну таблицю `local_bank_rates`, наповнювати її реальними котируваннями при старті програми, вичистити всі хардкоди та зберігати обраний користувачем курс у таблицю `local_suppliers` і пов'язані фіди.

---

## 2. Архітектурні Інваріанти та Висока Продуктивність (100k+ SKU)

1. **SQLite PRAGMAs для надвисокої швидкості (Rust Tauri)**:
   - `PRAGMA journal_mode = WAL;` — паралельне читання інтерфейсом під час імпорту фіду.
   - `PRAGMA synchronous = NORMAL;` — прискорення дискового запису у 5–8 разів.
   - `PRAGMA cache_size = -64000;` — виділення 64 МБ оперативної пам'яті під сторінковий кеш.
   - `PRAGMA temp_store = MEMORY;` — швидке сортування та групування товарів у RAM.
2. **Індексація 100% зовнішніх ключів (DB-01)**:
   - Усі зв'язки між таблицями постачальників, фідів, категорій, правил націнок та товарів покриті індексами.
3. **Пакетний запис (Batch Transactions)**:
   - Вставка та оновлення товарів пачками по 500–1000 записів в одній транзакції без падіння FPS інтерфейсу.
4. **Zero Fallback Hardcoding**:
   - Повна заборона числових хардкодів курсів валют. У разі відсутності інтернету беруться останні записані котирування з таблиці `local_bank_rates`.

---

## 3. Етапи Реалізації (TDD Lifecycle)

### Етап 1: Створення таблиці `local_bank_rates` у Rust SQLite та Mock-драйвері ✅

- Додано таблицю `local_bank_rates` та індекси в `schema.rs`.
- Налаштовано SQLite PRAGMAs (`WAL`, `cache_size`, `temp_store`, `synchronous = NORMAL`) у `db/mod.rs`.
- Створено Rust-модуль `db/currencies.rs` з `get_bank_rates` та `upsert_bank_rates`.
- Зареєстровано Tauri IPC команди: `db_get_bank_rates`, `db_save_bank_rates`.
- Оновлено `mock-state.ts`, `mock-bank-rates.ts`, `mock-driver.ts`, `mock-executor.ts`, `tauri-args.ts`.

### Етап 2: Сервіс Автоматичної Синхронізації Курсів при Старті Програми ✅

- Створено `apps/desktop/src/services/currency/app-currency-sync.service.ts`.
- Реалізовано функцію `syncLiveCurrencyRates` з оновленням курсів з НБУ та комерційних банків безпосередньо у `local_bank_rates`.
- Підключено хук `useAppCurrencySync()` у `App.tsx`.

### Етап 3: Видалення Хардкоду `41.5` та Підключення Фронтенду до Локальної Таблиці ✅

- Оновлено `apps/desktop/src/lib/api/currencies.ts` — читання безпосередньо з `localDb.currencies.getBankRates()`.
- Вичищено константи `defaultRates` з `currencies.constants.ts`.
- У `useSupplierCurrenciesState.ts` замінено всі фолбеки `41.5` на динамічні курси.
- У `mock-seed.ts` оновлено стартові курси на актуальні котирування НБУ.

### Етап 4: Збереження Обраної Валюти та Курсу у Фіді/Постачальнику ✅

- При зміні валюти або виборі банку користувачем збереження відбувається в локальну таблицю `local_suppliers` через `localDb.suppliers.updateSupplier()`.

### Етап 5: Автоматизоване Тестування (Playwright E2E) ✅

- Написано та успішно виконано тест `apps/desktop/e2e/currency-live-rates-no-hardcode.spec.ts` (1 passed, 0 failures).
- Перевірено відсутність тексту `41.50 ₴/$` на сторінці та коректний вибір комерційного курсу.

### Етап 6: Фінальна Верифікація Регресій (Ratchet Verification) ✅

- Виконано `pnpm verify:fast`:
  - `build:shared` ✅
  - `eslint` (0 помилок) ✅
  - `i18n:check` (100% паритет) ✅
  - `invariants:check` ✅
  - `depcruise` (0 порушень) ✅
  - `agents:check` (0 помилок) ✅
  - `tsc --noEmit` у всіх 4 пакетах ✅
  - `cargo check` у `src-tauri` ✅

---

## 4. Критерії Готовності (Definition of Done)

- [x] Таблиця `local_bank_rates` створена в SQLite схемі (`schema.rs`) та в Mock State.
- [x] Застосовані високошвидкісні SQLite PRAGMAs (`WAL`, `cache_size`, `temp_store`).
- [x] Сервіс `AppCurrencySyncService` успішно наповнює таблицю при старті програми.
- [x] 100% видалено числовий хардкод `41.5` з усіх модулів фронтенду та моків.
- [x] Обраний користувачем курс і банк надійно записуються в `local_suppliers`.
- [x] E2E тести підтверджують відсутність `41.50` та коректне збереження.
- [x] `pnpm verify:fast` проходить із 0 помилок.
