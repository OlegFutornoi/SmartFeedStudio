# 🛡️ Комплексний аудит безпеки та план усунення вразливостей (SmartFeed Studio)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 11.10.2026  
> **Агент-аудитор:** [Security & Penetration Testing Agent (`agents_security`)](file:///Users/oleg/AQA/SmartFeedStudio/.agents/references/agents_security.md)  
> **Агент-виконавець:** [Backend Agent (`agents_backend`)](file:///Users/oleg/AQA/SmartFeedStudio/.agents/references/agents_backend.md)  
> **Об'єкти перевірки:** Backend API (NestJS 11 CQRS), Admin Portal (Next.js 14), Desktop Client (Tauri v2 / SQLCipher / Keychain), База даних (PostgreSQL 16 / Prisma).

---

## 📊 Зведена матриця виявлених вразливостей

| ID         | Критичність          | Категорія (OWASP / CWE)                                 | Локалізація                                                       | Суть вразливості                                                                                                                                             |
| :--------- | :------------------- | :------------------------------------------------------ | :---------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-01** | 🔴 **CRITICAL (P0)** | **CWE-640 / OWASP A07** (Account Takeover)              | `services/backend-api/.../auth.service.ts:157`                    | Метод `forgotPassword` повертає валідний `resetToken` прямо у JSON-відповіді HTTP запиту. Будь-який користувач може скинути пароль Super Admin за 5 секунд.  |
| **SEC-02** | 🔴 **CRITICAL (P0)** | **CWE-862 / OWASP API4** (Unrestricted Resource Access) | `services/backend-api/.../licenses.controller.ts:133`             | Ендпоінт `POST /api/licenses/upgrade` активує будь-який тариф (ENTERPRISE) без перевірки факту оплати та ролі користувача.                                   |
| **SEC-03** | 🟠 **HIGH (P1)**     | **CWE-284 / OWASP API1** (Payment Fraud / BOLA)         | `services/backend-api/.../simulate-sandbox-webhook.handler.ts:29` | Симуляція оплати в пісочниці підписує транзакцію реальним бойовим ключем мерчанта без перевірки прапорця `isSandbox` або прод-середовища.                    |
| **SEC-04** | 🟠 **HIGH (P1)**     | **CWE-918 / OWASP A10** (SSRF via DNS Rebinding)        | `services/backend-api/.../fetch-feed-url.handler.ts:111`          | Валідація URL фіда перевіряє тільки ім'я хоста рядком без DNS-резолву IP-адреси. Можливий обхід через `*.nip.io` або DNS rebinding для сканування інтранету. |
| **SEC-05** | 🟠 **HIGH (P1)**     | **CWE-400 / CWE-78** (Server DoS & GUI Hang)            | `services/backend-api/.../workspace-dialogs.ts:8`                 | Серверні ендпоінти виклику діалогів відкриття папок спавнять процеси `osascript`/`powershell`/`zenity` на сервері з таймаутом 120с, спричиняючи підвисання.  |
| **SEC-06** | 🟡 **MEDIUM (P2)**   | **CWE-338** (Weak Cryptographic PRNG)                   | `apps/desktop/src-tauri/src/db.rs:20`                             | Генерація ключа шифрування SQLCipher SQLite використовує `SystemTime.as_nanos()` замість CSPRNG випадкових байтів.                                           |
| **SEC-07** | 🟡 **MEDIUM (P2)**   | **CWE-89** (Fragile SQL Escaping)                       | `apps/desktop/src-tauri/src/db.rs:740`                            | Ручна заміна лапок `.replace('\'', "''")` замість параметризованих запитів у `get_categories_summary`.                                                       |
| **SEC-08** | 🟡 **MEDIUM (P2)**   | **CWE-798** (Hardcoded Secrets Fallback)                | `handle-wayforpay-webhook.handler.ts:35`                          | Захардкоджені дефолтні ключі WayForPay та токена скидання пароля у разі відсутності змінних оточення.                                                        |

---

## 🔍 Детальний аналіз знахідок та PoC експлуатації

### 1. [SEC-01] Негайне захоплення акаунта через витік Reset Token у `forgotPassword`

- **Файл**: [`services/backend-api/src/modules/auth/auth.service.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/auth/auth.service.ts#L154-L159)
- **Механізм атаки**:
  ```http
  POST /api/auth/forgot-password HTTP/1.1
  Content-Type: application/json

  { "email": "admin@smartfeed.studio" }
  ```
  **Відповідь сервера (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "If this email is registered, password reset instructions have been sent.",
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
  Атакуючий бере `resetToken` і викликає `POST /api/auth/reset-password`, змінюючи пароль адміністратора на власний.
- **Виправлення**: Прибрати `resetToken` з DTO відповіді `ForgotPasswordResponseDto`. Токен має надсилатися виключно через поштовий сервіс (`MailService`). У тестах e2e токен генерується або читається напряму через тестові хелпери.

---

### 2. [SEC-02] Несанкціонований безкоштовний апгрейд ліцензії через `POST /licenses/upgrade`

- **Файл**: [`services/backend-api/src/modules/licenses/licenses.controller.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/licenses/licenses.controller.ts#L129-L138)
- **Механізм атаки**:
  ```http
  POST /api/licenses/upgrade HTTP/1.1
  Authorization: Bearer <user_jwt>
  Content-Type: application/json

  { "planType": "ENTERPRISE" }
  ```
  Контролер безпосередньо виконує `new CreateLicenseCommand(userId, dto.planType)`, оминаючи WayForPay, інвойси та оплату.
- **Виправлення**: Видалити публічний ендпоінт `POST /licenses/upgrade` або перевести його під `@UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.SUPER_ADMIN)`. Для клієнта апгрейд дозволений тільки через `POST /payments/checkout` з подальшою активацією через підписаний вебхук.

---

### 3. [SEC-03] Шахрайство з оплатою через `simulate-sandbox-webhook`

- **Файл**: [`services/backend-api/src/modules/payments/commands/simulate-sandbox-webhook.handler.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/payments/commands/simulate-sandbox-webhook.handler.ts#L29-L65)
- **Механізм атаки**:
  Користувач ініціює чек-аут на платний тариф, отримує `orderReference`, після чого надсилає запит на `/api/payments/simulate-sandbox-webhook`. Сервер підписує фейковий платіж реальним секретом мерчанта і активує підписку.
- **Виправлення**: Додати перевірку:
  ```typescript
  if (!setting?.isSandbox || process.env.NODE_ENV === 'production') {
    throw new ForbiddenException('Simulation is disabled in production or live payment mode');
  }
  ```

---

### 4. [SEC-04] SSRF через відсутність DNS-резолву IP в `fetch-feed-url`

- **Файл**: [`services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts#L111-L138)
- **Механізм атаки**:
  URL на кшталт `http://127.0.0.1.nip.io:5432` або `http://test.localtest.me:6379` проходить перевірку `hostname === '127.0.0.1'`, оскільки hostname містить доменне ім'я, яке резолвиться в loopback IP лише на етапі `fetch()`.
- **Виправлення**: Використовувати `dns.promises.lookup` перед виконанням запиту для отримання реальної IP-адреси. Якщо IP належить до `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` або IPv6 loopback — відхиляти з `400 Bad Request`.

---

### 5. [SEC-05] Небезпечні системні виклики GUI на бекенд-сервері (`workspace-dialogs.ts`)

- **Файл**: [`services/backend-api/src/modules/storage/utils/workspace-dialogs.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/storage/utils/workspace-dialogs.ts#L4-L60)
- **Механізм атаки**:
  Клієнт відправляє `POST /api/storage/workspace/select-folder`. На сервері (в Docker-контейнері чи Linux-хості) запускається `osascript` / `zenity` / `powershell`, який висить до 120 секунд, виснажуючи ресурси контейнера.
- **Виправлення**: Діалоги вибору папок належать виключно нативному десктопу (Tauri IPC `pick_workspace_folder`). На бекенд-сервері ендпоінти вибору локальних папок клієнта повинні повертати `400 Bad Request` або бути видалені.

---

### 6. [SEC-06] Слабкий генератор ключа шифрування SQLite SQLCipher

- **Файл**: [`apps/desktop/src-tauri/src/db.rs`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src-tauri/src/db.rs#L19-L26)
- **Механізм атаки**:
  Ключ формується через `SystemTime::now().as_nanos()`. Знаючи час створення файлу `catalog.db`, атакуючий може значно звузити простір перебору наносекунд.
- **Виправлення**: Генерувати 32 криптографічно стійких випадкових байти через CSPRNG (наприклад, крейт `rand::RngCore` або OS random).

---

### 7. [SEC-07] Ручна екранізація лапок у `db.rs` замість параметрів

- **Файл**: [`apps/desktop/src-tauri/src/db.rs`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src-tauri/src/db.rs#L740)
- **Виправлення**: Замінити інтерполяцію рядка на параметризований запит Rusqlite:
  ```rust
  let mut stmt = conn.prepare("SELECT ... WHERE (?1 IS NULL OR supplier_id = ?1) ...")?;
  let iter = stmt.query_map(params![supplier_id], |row| { ... })?;
  ```

---

### 8. [SEC-08] Видалення хардкод-секретів fallback

- **Файл**: [`handle-wayforpay-webhook.handler.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/payments/commands/handle-wayforpay-webhook.handler.ts#L35)
- **Виправлення**: Якщо секрет не налаштований у базі та немає у змінних середовища — викидати виняток `InternalServerErrorException('WayForPay merchant secret key is not configured')` замість використання захардкодженого рядка.

---

## 🛠 Покроковий план впровадження виправлень (4-шаровий захист)

### Етап 1: Критичні виправлення бекенду (P0)

1. [x] Усунути витік `resetToken` у `auth.service.ts`: видалити поле з `ForgotPasswordResponseDto` та відповіді сервера.
2. [x] Захистити `POST /licenses/upgrade`: видалити або закрити правами `Role.ADMIN, Role.SUPER_ADMIN`.
3. [x] Захистити `simulateSandboxWebhook`: додати жорстку перевірку `isSandbox === true` та заборону в `production`.

### Етап 2: Захист від SSRF та DoS (P1)

4. [x] Додати DNS pre-lookup та валідацію приватних IP діапазонів у `fetch-feed-url.handler.ts`.
5. [x] Заборонити або деактивувати запуск серверних GUI-діалогів у `workspace-dialogs.ts` на бекенді.

### Етап 3: Десктоп та криптографія (P2)

6. [x] Оновити генерацію ключа SQLCipher у `src-tauri/src/db.rs` на CSPRNG 256-біт.
7. [x] Замінити конкатенацію запиту в `get_categories_summary` на параметризований SQL.
8. [x] Прибрати всі hardcoded fallback secrets.

### Етап 4: Автоматизовані тести безпеки та валідація

9. [x] Написати Jest E2E тести у `security-access-control.e2e-spec.ts` для перевірки блокування кожного з виявлених векторів (SEC-01 - SEC-05).
10. [x] Прогнати цільовий сьют `pnpm --filter @smartfeed/backend-api test:e2e -- test/security-access-control.e2e-spec.ts`.
