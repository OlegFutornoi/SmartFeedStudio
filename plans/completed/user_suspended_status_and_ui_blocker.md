# 📋 План реалізації: Розділення статусу блокування користувача (USER_SUSPENDED) та ліцензії

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 11.10.2026  
> **Автори:** Backend Agent (`agents_backend`) & Frontend Agent (`agents_frontend`)  
> **Ціль:** Усунути хибне відкриття модального вікна бази даних та некоректного банера "Немає активної ліцензії" при призупиненні користувача; створити виділений повноцінний UI-екран блокування акаунту `UserSuspendedBlocker` з контактами підтримки.

---

## 🔍 1. Root Cause Analysis (Аналіз проблеми)

1. **Конфлікт 401 Unauthorized та спливання вікна БД**:
   - Раніше бекенд у `jwt.strategy.ts` повертав generic `401 Unauthorized`.
   - Клієнт вважав це простроченням сесії, запускав цикл `refreshAuthSession()`, який теж падав, і очищав збережену сесію в `localStorage`.
   - Внаслідок скидання стану авторизації `WorkspaceStorageContext` помилково вважав, що додаток запущено вперше без користувача, і форсував `FirstRunWorkspaceSetupDialog` («Налаштування локальної бази даних»).
2. **Підміна статусу користувача на статус ліцензії**:
   - Оскільки запит `getMyLicense()` падав, `LicenseContext` фіксував `setLicense(null); setIsExpired(true);`.
   - `DashboardLayout` бачив `isExpired === true` і відображав `ExpiredPlanBlocker` ("Немає активної ліцензії").
   - **Виправлено**: блокування облікового запису (людини) тепер чітко відокремлене від ліцензії.

---

## 🎨 2. UI / UX Рішення: `UserSuspendedBlocker`

Замість спливаючих вікон БД та тарифних пропозицій користувач бачить ізольований екран блокування:

```text
 ┌────────────────────────────────────────────────────────┐
 │                                                        │
 │                   [ 🛡️ ]                               │
 │            (Червоно-янтарний бейдж)                    │
 │                                                        │
 │           Обліковий запис призупинено                  │
 │                                                        │
 │  Ваш обліковий запис було призупинено адміністрацією.  │
 │  Доступ до синхронізації та функцій платформи          │
 │  тимчасово заблоковано. Зверніться до підтримки.       │
 │                                                        │
 │  ┌──────────────────────────────────────────────────┐  │
 │  │ merchant@store.com                               │  │
 │  └──────────────────────────────────────────────────┘  │
 │                                                        │
 │  [ Зв'язатися з підтримкою ✉️ ]   [ Вийти з акаунту 🚪 ] │
 │                                                        │
 └────────────────────────────────────────────────────────┘
```

---

## 🏛 3. Архітектурні зміни за 4-рівневою моделлю

### Рівень 1 (Контракти & DTO):

- У `@smartfeed/shared` додано `AuthErrorCode.USER_SUSPENDED = 'USER_SUSPENDED'`.
- Пакет успішно зібрано через `pnpm build`.

### Рівень 2 (Backend CQRS & Guards):

- У `services/backend-api/src/modules/auth/strategies/jwt.strategy.ts`:
  - Якщо `user.isActive === false`, викидається `ForbiddenException({ code: AuthErrorCode.USER_SUSPENDED, message: '...' })`.
- У `AuthService.login` та `AuthService.refreshToken`:
  - Перевіряється `user.isActive === false` та повертається `403 Forbidden` з `code: AuthErrorCode.USER_SUSPENDED`.

### Рівень 3 (Frontend State Management & Interceptors):

- У `apps/desktop/src/lib/api/client.ts`:
  - При отриманні 403 `USER_SUSPENDED` надсилається глобальна подія `smartfeed:user-suspended`, оновлюється кешований статус у `localStorage`.
- У `apps/desktop/src/contexts/AuthContext.tsx`:
  - Додано стан `isSuspended: boolean`, слухач події, обробка у `refreshProfile()`.
- У `apps/desktop/src/contexts/WorkspaceStorageContext.tsx`:
  - Якщо `user?.isActive === false` або `isSuspended`, модалка `FirstRunWorkspaceSetupDialog` ніколи не показується.
- У `apps/desktop/src/contexts/LicenseContext.tsx`:
  - Якщо користувач призупинений, ліцензія НЕ позначається простроченою (`isExpired: false`).
- У `apps/desktop/src/components/layout/DashboardLayout.tsx`:
  - Найвищий пріоритет перевірки: `if (isUserSuspended) return <UserSuspendedBlocker />;`.

### Рівень 4 (i18n & Локалізація):

- Додано двомовні переклади (UA / EN) у `apps/desktop/src/i18n/locales/uk/auth.json` та `en/auth.json`:
  - `accountSuspendedTitle`
  - `accountSuspendedDesc`
  - `contactSupport`
  - `logout`

---

## 📋 4. Покроковий чеклист реалізації

- [x] **Крок 1**: Контракти `@smartfeed/shared` — константа помилки `USER_SUSPENDED`.
- [x] **Крок 2**: Бекенд `jwt.strategy.ts` та `auth.service.ts` — повернення 403 `USER_SUSPENDED`.
- [x] **Крок 3**: Клієнтський перехоплювач `client.ts` та `AuthContext.tsx` — обробка та прапорець `isSuspended`.
- [x] **Крок 4**: `WorkspaceStorageContext.tsx` — блокування появи вікна конфігурації бази при `isSuspended`.
- [x] **Крок 5**: Створення компонента `UserSuspendedBlocker.tsx` (<85 рядків) та підключення в `DashboardLayout.tsx`.
- [x] **Крок 6**: Словники локалізації UA / EN (`uk/auth.json`, `en/auth.json`), 100% перевірка `pnpm i18n:check`.
- [x] **Крок 7**: Цільові тести Playwright / E2E:
  - Бекенд Jest E2E (`test/auth.e2e-spec.ts`): 18/18 PASS.
  - Десктоп Playwright (`e2e/user-suspended.spec.ts`): 2/2 PASS.
- [x] **Крок 8**: Перевірка типів `tsc --noEmit` (бекенд і десктоп 0 помилок) та форматування `pnpm format`.
