# 🛡️ План: Сувора валідація типів файлів (MIME & Magic Bytes), гейтинг аналізу фідів та безпека аватарів (Frontend + Backend)

## 1. Огляд та бізнес-вимоги

**Проблема та зауваження від користувача:**

1. **Відсутність валідації розширення та формату файлу у майстрі імпорту:**
   - Користувач перетягнув файл `xml_link.md` (Markdown-файл).
   - Система без заперечень прийняла його, показала картку `xml_link.md Готовий до аналізу`, а нижче відобразила `Фід успішно проаналізовано (Rozetka XML, 0 SKU, 0 категорій)`.
   - Кнопка «Далі до постачальника» стала активною і зеленою! У систему можна завантажити скрипт, шкідливий файл чи довільний текст.
2. **Порушення послідовності аналізу («Поки не натиснуть кнопку аналіз далі йти не можна»):**
   - Кнопка переходу на наступний крок повинна бути **заблокована** (`disabled`), доки користувач явно не натисне кнопку «Аналізувати» ТА аналіз не завершиться успішно з кількістю знайдених SKU > 0.
   - Автоматичний перехід або активація кнопки без валідного аналізу категорично неприпустимі.
3. **Безпека аватарів та профілів користувачів / постачальників:**
   - Аватари та логотипи в системі повинні суворо валідуватися як на фронтенді (для зручності користувача), так і обов'язково на бекенді (AppSec).
   - Заборонено приймати SVG (джерело Stored XSS через `<script>`/`<svg onload>`), HTML-файли, небезпечні data URI (`data:text/html`), протоколи `javascript:`.
   - Бекенд повинен перевіряти Magic Bytes (сигнатури байтів `FF D8 FF` для JPEG, `89 50 4E 47` для PNG, `RIFF...WEBP` для WebP), а не сліпо вірити заголовкам клієнта.

---

## 2. Архітектурні інваріанти (Domain Invariants)

1. **`SEC-07` (Strict File Type & Magic Bytes Ingestion)**:
   - Файли фідів можуть мати виключно розширення: `.xml`, `.yml`, `.csv`, `.tsv`, `.xlsx`, `.xls`. Будь-які інші файли (`.md`, `.exe`, `.sh`, `.php`, `.js` тощо) відхиляються з помилкою валідації як на фронтенді (при drag-and-drop / виборі), так і на бекенді.
   - Аватари та логотипи можуть бути виключно форматами: JPEG, PNG, WebP. Формат SVG суворо заборонено через ризик Stored XSS. Бекенд валідує перші байти файлу (Magic Bytes).
2. **`SEC-08` (Zero 0-SKU Feed Progression & Format Integrity)**:
   - Якщо файл не містить валідної розмітки XML/CSV або в ньому знайдено 0 товарів (`totalDetected === 0`), такий фід не вважається успішно проаналізованим.
   - `detectFeedFormat` заборонено мовчки призначати `XML_ROZETKA` для довільного тексту чи файлів без ознак XML. Невідомий формат повертає помилку `INVALID_FEED_FORMAT`.
3. **`UI-FEED-01` (Mandatory Explicit Analysis Gate)**:
   - Кнопка «Далі до постачальника» на кроці вибору джерела активується **виключно** після успішного аналізу (`analysis !== null && analysis.totalDetected > 0`).
   - Будь-яка зміна URL або вибір нового файлу негайно скидає `analysis` у `null` та деактивує кнопку переходу.
   - Автоматичний прихований аналіз під час кліку на «Далі» ліквідується.

---

## 3. Покроковий план виконання (Tracer-Bullet Vertical Slices)

### Крок 1: Backend AppSec — Валідація аватарів та перевірка Magic Bytes

- **Файли**:
  - `services/backend-api/src/modules/auth/dto/update-avatar.dto.ts`
  - `services/backend-api/src/modules/auth/auth.controller.ts`
  - `services/backend-api/src/modules/users/commands/update-user-avatar.handler.ts`
  - `services/backend-api/test/auth-avatar.e2e-spec.ts`
- **Зміни**:
  - У `UpdateAvatarDto` створити валідатор, що перевіряє:
    - Якщо передано Base64 Data URI: префікс повинен бути `data:image/(jpeg|png|webp);base64,`. Заборонити `data:image/svg+xml`, `data:text/html`.
    - Декодувати перші 16 байтів Base64 та верифікувати Magic Bytes:
      - JPEG: `0xFF, 0xD8, 0xFF`
      - PNG: `0x89, 0x50, 0x4E, 0x47`
      - WebP: `RIFF` ... `WEBP`
    - Якщо передано HTTP URL: протокол виключно `https://`, розширення `.jpg`, `.jpeg`, `.png`, `.webp`, відсутність `javascript:` чи небезпечних символів.
  - Написати Supertest E2E тести: відхилення SVG, відхилення HTML-скрипта у base64, відхилення фейкових заголовків.

### Крок 2: Backend Feeds API — Валідація типів файлів та вмісту фіду

- **Файли**:
  - `services/backend-api/src/modules/feeds/dto/import-feed-async.dto.ts`
  - `services/backend-api/src/modules/feeds/feeds.controller.ts`
  - `services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts`
  - `services/backend-api/test/feeds.e2e-spec.ts`
- **Зміни**:
  - У `ImportFeedAsyncDto` додати валідацію `fileName`: розширення тільки `xml`, `yml`, `csv`, `tsv`, `xlsx`, `xls`, `txt`.
  - У `fetchFeedUrl` перевіряти, що отриманий контент схожий на XML або CSV (починається з `<` або містить розділювачі CSV), відхиляти HTML 404/помилки чи бінарні файли.
  - E2E тести на відхилення файлів з розширенням `.md`, `.exe`, `.js`.

### Крок 3: Desktop Feed Engine — Виправлення `format-detector` та ліквідація 0-SKU «успіху»

- **Файли**:
  - `apps/desktop/src/services/feed-engine/format-detector.ts`
  - `apps/desktop/src/services/feed-engine/stream-parser.ts`
  - `apps/desktop/src/services/feed-engine/xml-parser.ts`
- **Зміни**:
  - У `format-detector.ts`: видалити небезпечний фолбек `return { format: FeedFormat.XML_ROZETKA, isXml: true }`. Якщо контент не є XML і не є CSV, повертати `FeedFormat.UNKNOWN` або кидати виключення.
  - У `stream-parser.ts`: якщо формат `UNKNOWN` або знайдено 0 товарів — викидати зрозумілу помилку валідації `INVALID_FEED_FORMAT` («Файл не містить коректної структури XML або CSV каталогу товарів»).

### Крок 4: Frontend Wizard — Суворий відбір розширень та гейтинг «Аналізувати»

- **Файли**:
  - `apps/desktop/src/components/feeds/WizardStepSource.tsx`
  - `apps/desktop/src/components/feeds/WizardDialogFooter.tsx`
  - `apps/desktop/src/components/feeds/useWizardStepValidation.ts`
  - `apps/desktop/src/components/feeds/useImportFeedWizard.ts`
  - `apps/desktop/src/components/feeds/useFeedAnalysis.ts`
- **Зміни**:
  - У `WizardStepSource.tsx`:
    - Перевірка розширення файлу при Drag & Drop та виборі через діалог. Якщо розширення не в списку `['xml', 'yml', 'csv', 'tsv', 'xlsx', 'xls']` — НЕ приймати файл, показати чітку помилку «Непідтримуваний тип файлу: дозволені лише .xml, .yml, .csv, .xlsx, .xls».
    - При зміні файлу або введенні URL — скидати `analysis` у `null` та очищати попередні результати.
  - У `WizardDialogFooter.tsx`:
    - Кнопка «Далі до постачальника» на кроці `SOURCE` має умову:
      `disabled={!analysis || analysis.totalDetected === 0 || isAnalyzing || isFeedLimitReached}`.
    - Додати підказку (tooltip): «Спочатку натисніть кнопку «Аналізувати» для перевірки фіду».
  - У `useWizardStepValidation.ts`:
    - Прибрати авто-запуск `performAnalysis()` під час кліку «Далі». Якщо аналіз не проведено — блокувати перехід і виводити повідомлення.

### Крок 5: Frontend Avatar Uploaders — Захист від небезпечних файлів

- **Файли**:
  - `apps/desktop/src/services/localUserProfile.ts`
  - `apps/desktop/src/components/profile/ProfileAvatarCard.tsx`
  - `apps/desktop/src/modules/suppliers/components/forms/SupplierAvatarPicker.tsx`
- **Зміни**:
  - Змінити `accept="image/*"` на `accept="image/jpeg,image/png,image/webp"`.
  - У `optimizeAvatarImage`: читати перші байти через `FileReader.readAsArrayBuffer` та перевіряти Magic Bytes перед передачею в `Image()`. Категорично відхиляти SVG та інші небезпечні типи.
  - У `SupplierAvatarPicker.tsx`: блокувати протоколи, відмінні від `https://` у полі URL.

### Крок 6: Верифікація та тести (Definition of Done)

- Прогнати Supertest E2E тести бекенду (аватари + валідація фідів).
- Прогнати Playwright E2E тести десктопу (майстер імпорту + аватари).
- Перевірити `pnpm invariants:check` (нуль порушень) та `pnpm i18n:check` (100% паритет).
- Перевірити `pnpm --filter @smartfeed/desktop exec tsc --noEmit` та `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.

---

## 4. Definition of Done (DoD)

1. [x] Файл `.md` (або будь-який інший невалідний файл) миттєво відхиляється на фронтенді та бекенді.
2. [x] Неможливо натиснути «Далі до постачальника» без попереднього натискання кнопки «Аналізувати» та успішного виявлення >0 SKU.
3. [x] `detectFeedFormat` не призначає `XML_ROZETKA` для не-XML файлів, а повертає помилку формату.
4. [x] Бекенд та фронтенд валідують аватари за сигнатурою Magic Bytes (JPEG, PNG, WebP) та блокують SVG/HTML/XSS.
5. [x] 100% E2E тестів (Jest + Playwright) проходять успішно.
6. [x] `pnpm invariants:check` та `pnpm i18n:check` мають 0 помилок.
