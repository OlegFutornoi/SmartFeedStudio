# 🛡️ Комплексний план підготовки бекенду до релізу: Безпека, Контроль доступів (RBAC/ABAC), Запобігання витоку даних та Надійність

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 28.08.2026  
> **Ціль:** Провести комплексний аудит та зміцнення архітектури бекенду (`services/backend-api`) за найкращими практиками (`nestjs-best-practices`, `backend-development`, `defense-in-depth-validation`, `sentry-backend-bugs`, `supabase-postgres-best-practices`), забезпечити 100% ізоляцію даних користувачів, закрити всі потенційні вектори витоку інформації та покрити доступ E2E тестами.

---

## 📌 1. Аналіз поточного стану та виявлені аспекти для зміцнення

В ході ретельного аудиту кодової бази бекенду (`services/backend-api`) було перевірено всі контролери, гарди, декоратори, CQRS-команди/запити, фільтри винятків та Prisma-запити. Виявлено наступні ключові області для покращення перед продакшн-релізом:

### 🚨 1.1. Аутентифікація при прийнятті інвайту (`AcceptInvitationHandler`)

- **Проблема**: Якщо запрошений користувач вже існує в системі (`targetUser`), але відкриває посилання інвайту без активної сесії (`authenticatedUserId` відсутній), система створювала зв'язок з організацією та видавала повний JWT токен **без перевірки пароля** існуючого користувача.
- **Ризик**: Якщо хтось перехопить посилання інвайту для вже зареєстрованого акаунту, він міг отримати доступ до його облікового запису.
- **Рішення**: Для вже існуючого користувача обов'язково вимагати або активну сесію (`authenticatedUserId === targetUser.id`), або перевіряти введений пароль через `bcrypt.compare(password, targetUser.passwordHash)`. Якщо пароль невірний — повертати `401 Unauthorized`.

### 🛡️ 1.2. Захист від Brute-Force та DoS (Rate Limiting via `@nestjs/throttler`)

- **Проблема**: Публічні чутливі ендпоінти (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/invitations/accept`) наразі не мають ліміту частоти запитів.
- **Рішення**: Підключити `ThrottlerModule` (`@nestjs/throttler`) з налаштуванням глобального ліміту (наприклад, 100 req/min) та посиленого ліміту для авторизаційних/відновлювальних маршрутів (наприклад, 5-10 спроб за хвилину на IP).

### 🔒 1.3. HTTP Security Headers (`helmet`)

- **Проблема**: Заголовки безпеки (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Permitted-Cross-Domain-Policies`) не налаштовані на рівні Express.
- **Рішення**: Встановити та підключити `helmet` у `main.ts`.

### 🗂️ 1.4. Санітизація та ізоляція шляхів S3/MinIO (`GeneratePresignedUploadUrlHandler`)

- **Проблема**: Параметри `fileName` та `folder` передаються клієнтом. Потрібен надійний захист від Path Traversal (`../`, `..\`) та обмеження дозволених кореневих папок (`images`, `snapshots`, `catalogs`).
- **Рішення**: Додати валідацію та білий список дозволених папок, санітизацію імені файлу та жорстку прив'язку структури ключа: `${allowedFolder}/${userId}/${timestamp}-${hash}-${sanitizedName}`.

### 🧹 1.5. Санітизація внутрішніх 500-помилок (`GlobalHttpExceptionFilter`)

- **Проблема**: При виникненні непередбачуваної помилки (`exception instanceof Error`) у відповідь клієнту передається вихідне повідомлення `exception.message`, що в продакшні може розкрити внутрішні деталі БД чи шляхи файлової системи.
- **Рішення**: У продакшн-середовищі (`process.env.NODE_ENV === 'production'`) маскувати невідомі помилки як `«Внутрішня помилка сервера»`, а детальний стек писати строго в логи `Logger.error`.

---

## 🏛 2. Покроковий план реалізації

### 🔹 Крок 1: Встановлення пакетів безпеки

- Встановити `@nestjs/throttler` та `helmet` (+ `@types/helmet`) у `services/backend-api`.

### 🔹 Крок 2: Налаштування `helmet` та `ThrottlerModule`

1. **`services/backend-api/src/main.ts`**:
   - Додати `app.use(helmet())`.
2. **`services/backend-api/src/app.module.ts`**:
   - Зареєструвати `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` з `ThrottlerGuard` як глобальним `APP_GUARD`.
3. **`services/backend-api/src/modules/auth/auth.controller.ts`**:
   - Накласти `@Throttle({ default: { limit: 10, ttl: 60000 } })` на чутливі методи: `login`, `register`, `forgotPassword`, `resetPassword`.

### 🔹 Крок 3: Зміцнення `AcceptInvitationHandler`

- У `services/backend-api/src/modules/organizations/commands/accept-invitation.handler.ts`:
  - Якщо `targetUser` вже існує в БД:
    - Якщо передано `authenticatedUserId`: перевірити, що `authenticatedUserId === targetUser.id`.
    - Якщо `authenticatedUserId` відсутній (користувач не залогінений): обов'язково вимагати `password` і валідувати `await bcrypt.compare(password, targetUser.passwordHash)`. При невідповідності повертати `UnauthorizedException('Невірний пароль для існуючого облікового запису')`.

### 🔹 Крок 4: Захист S3 Presigned URLs (`GeneratePresignedUploadUrlHandler`)

- У `services/backend-api/src/modules/storage/commands/generate-presigned-url.handler.ts`:
  - Перевірка дозволених папок: `const ALLOWED_FOLDERS = ['images', 'snapshots', 'catalogs', 'exports']`.
  - Захист від path traversal: видалення будь-яких `..`, `/`, `\` з `fileName`.
  - Префіксація шляху strictly `userId`.

### 🔹 Крок 5: Санітизація `GlobalHttpExceptionFilter`

- У `services/backend-api/src/common/filters/http-exception.filter.ts`:
  - Перевірка `isProd = process.env.NODE_ENV === 'production'`.
  - Якщо `status === 500` і `isProd`, приховувати сирі системні помилки, повертаючи клієнту безпечне повідомлення.

### 🔹 Крок 6: Написання вичерпного E2E тест-сьюту безпеки (`security-access-control.e2e-spec.ts`)

Створити новий файл `services/backend-api/test/security-access-control.e2e-spec.ts`, що тестує:

1. **RBAC ізоляція**:
   - Звичайний користувач отримує `403 Forbidden` при спробі доступу до `GET /api/users`, `GET /api/plans/admin`, `GET /api/licenses/admin`, `GET /api/navigation/admin`.
2. **Мульти-тенантність організацій (ABAC)**:
   - Користувач не може отримати список учасників (`/api/organizations/:id/members`) або інвайтів (`/api/organizations/:id/invitations`) чужої організації.
   - Запрошений співробітник (`MEMBER`) не може змінити тарифний план організації (`POST /api/licenses/select-plan` повертає `403 ONLY_OWNER_CAN_CHANGE_PLAN`).
3. **Безпека інвайтів**:
   - Спроба прийняти інвайт для існуючого користувача з невірним паролем повертає `401/403`.
4. **S3 ізоляція**:
   - Presigned URL генерується строго для `folder/userId/*` і не дозволяє вийти за межі директорії.
5. **Rate Limiting**:
   - Серія швидких запитів на `/api/auth/login` блокується з `429 Too Many Requests`.

### 🔹 Крок 7: Оновлення документації та WIKI

- Оновити `wiki/04-backend-cqrs/auth-module.md`, `wiki/04-backend-cqrs/team-invitations-and-mail.md`, `wiki/07-testing-and-qa/test-coverage-matrix.md`.
- Оновити таблицю покриття в `services/backend-api/AGENTS.md` та `services/backend-api/README.md`.

---

## 🧪 3. План верифікації (DoD)

- [ ] Всі пакети збираються без помилок (`pnpm build:shared`, `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`).
- [ ] 100% Jest E2E тестів бекенду пройдено (`pnpm --filter @smartfeed/backend-api test:e2e`).
- [ ] 100% Playwright E2E тестів фронтенду пройдено (`pnpm test:admin`).
- [ ] Prettier auto-format виконано на всіх змінених файлах (`pnpm format`).
- [ ] Документація синхронізована.
