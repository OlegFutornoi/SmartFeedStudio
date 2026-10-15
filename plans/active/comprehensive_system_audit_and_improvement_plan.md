# 📋 План: Комплексний аудит та програма покращення SmartFeed Studio

> **Статус:** 🟢 **Виконано та верифіковано (Completed & Verified)**  
> **Дата виконання:** 15.10.2026  
> **Виконавці:** Frontend Agent (`@agents_frontend`), Backend Agent (`@agents_backend`)  
> **Цільові напрямки:** Швидкість, Надійність, Якість коду, Взаємодія бекенд, Безпека

---

## 1. Резюме аудиту за 5 осями

| Напрямок                              | Оцінка    | Ключовий стан                                                                                                                                                                                                                                   |
| ------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Безпека (Security)**                | 🟡 8.0/10 | 100% захист мутацій (`JwtAuthGuard`), 100% валідація DTO (`class-validator`), відсутній шелл-ін'єкшн. Виявлено: fallback тестових ключів у платежах, ризик TOCTOU SSRF при завантаженні фідів, відсутність інвалідації JWT при зміні пароля.    |
| **Швидкість (Speed & Perf)**          | 🟡 8.2/10 | 100% індексація зовнішніх ключів (FK), GIN pg_trgm для пошуку. Виявлено: читання великих XML-фідів цілком у пам'ять (`response.text()`) замість stream backpressure, відсутність кешування користувача у `JwtStrategy` (DB hit на кожен запит). |
| **Надійність (Reliability)**          | 🟢 8.8/10 | BullMQ та Redis інтегровано, транзакційні перевірки ліцензій. Виявлено: відсутність розподіленого м'ютексу/транзакційного блокування при повторних вебхуках WayForPay, слабкий лог помилок при копіюванні файлів.                               |
| **Якість коду (Code Quality)**        | 🟢 9.0/10 | 0 помилок у `tsc --noEmit` по всьому монорепозиторію, 100% i18n parity, 0 critical lint errors. Виявлено: 8 компонентів перевищують ліміт 250-300 рядків (`CORE-04`), 2 випадки `any` в тестах.                                                 |
| **Взаємодія бекенд (Backend/Client)** | 🟢 9.2/10 | Чітке розділення Desktop Tauri (SQLite/Keychain) та Headless Cloud API (`ARCH-01`), відсутність спавну GUI на сервері (`ARCH-02`), спільні контракти `@smartfeed/shared`.                                                                       |

---

## 2. Детальний реєстр виявлених дефектів та точок росту

### [P0 / P1] Безпека та Стійкість до відмов (Security & Critical Resilience)

1. **BE-04 / CWE-798: Тестовий fallback секретного ключа платежів**
   - **Файл:** [`services/backend-api/src/modules/payments/commands/create-payment-invoice.handler.ts:70-74`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/payments/commands/create-payment-invoice.handler.ts#L70-L74)
   - **Дефект:** При відсутності налаштування в БД та змінної оточення код використовує дефолтний тестовий ключ `'flk3409refn54t54t*FNJRET'`.
   - **Вимога інваріанта:** При відсутності бойового ключа система зобов'язана викидати `InternalServerErrorException` (fail-fast), а не підставляти хардкод.

2. **SEC-05: TOCTOU SSRF ризик (DNS Rebinding) при парсингу віддалених фідів**
   - **Файл:** [`services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts:27-40`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts#L27-L40)
   - **Дефект:** `validateUrlSafety(currentUrl)` валідує IP через `dns.lookup()`, але подальший виклик `fetch(currentUrl)` виконує новий DNS-запит. Зловмисник може налаштувати DNS з коротким TTL (DNS Rebinding), щоб обійти фільтрацію внутрішньої мережі (AWS metadata `169.254.169.254`, `localhost`).
   - **Рішення:** Фіксація (pinning) resolved IP або прямий запит за IP із заголовком `Host`.

3. **BE-09: Ризик OOM DoS при завантаженні фідів з Chunked Transfer Encoding**
   - **Файл:** [`services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts:80-86`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts#L80-L86)
   - **Дефект:** Перевірка `content-length` спрацьовує тільки якщо заголовок передано. Виклик `response.text()` вичитує весь потік у пам'ять Node.js process. Потік розміром 200-500 МБ спричинить Out-Of-Memory падіння бекенду.
   - **Рішення:** Потокове вичитування з підрахунком отриманих байтів через `ReadableStream` та аварійним перериванням при перевищенні 50 МБ.

4. **BE-07: Concurrency & Idempotency у вебхуках WayForPay**
   - **Файл:** [`services/backend-api/src/modules/payments/commands/handle-wayforpay-webhook.handler.ts:60-70`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/payments/commands/handle-wayforpay-webhook.handler.ts#L60-L70)
   - **Дефект:** Перевірка `transaction.status === 'APPROVED'` та подальше оновлення з видачею ліцензії виконуються без м'ютексу. При паралельній повторній відправці вебхука платіжним шлюзом можливий race condition та подвійна активація тарифу.
   - **Рішення:** Redis-м'ютекс на `lock:payment:orderReference` або ізольована транзакція з рівнем `SERIALIZABLE` / row-level lock `SELECT ... FOR UPDATE`.

---

### [P2] Швидкість та Оптимізація ресурсів (Performance & Caching)

5. **Кешування користувача в `JwtStrategy.validate`**
   - **Файл:** [`services/backend-api/src/modules/auth/strategies/jwt.strategy.ts:40-50`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/auth/strategies/jwt.strategy.ts#L40-L50)
   - **Проблема:** На КОЖЕН авторизований HTTP-запит виконується запит у PostgreSQL (`GetUserByIdQuery` з join таблиці `organizationMemberships`). При активній роботі клієнта це створює десятки зайвих важких запитів на секунду.
   - **Рішення:** Кешувати статус та роль користувача в Redis / пам'яті на 30–60 секунд за `userId` (з інвалідацією при блокуванні або зміні ролі).

6. **Кешування статичних та рідко змінюваних сутностей**
   - **Файли:** `TariffPlan`, `PageGuide`, `NavigationItem`, `LegalDocument`.
   - **Рішення:** Впровадити Cache-Aside через `RedisCacheModule` для публічних ендпоінтів списку планів та навігації.

7. **Інвалідація активних сесій при зміні пароля (Token Revocation)**
   - **Файл:** [`services/backend-api/src/modules/auth/services/token.service.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/auth/services/token.service.ts)
   - **Проблема:** JWT access token діє до 30 днів без збереження версії токена (`tokenVersion`) у БД. Якщо пароль змінено, скомпрометований токен залишається активним.
   - **Рішення:** Додати `tokenVersion` в модель `User` та перевіряти його у `jwt.strategy.ts`.

---

### [P3] Якість коду, Модульність та Фронтенд (Code Quality & UX)

8. **CORE-04: Декомпозиція великих компонентів (>250 рядків)**
   - `apps/desktop/src/services/local-db/client.ts` (328 рядків) ➔ декомпозиція на модулі ініціалізації, міграцій та транзакцій.
   - `apps/desktop/src/components/signup-form.tsx` (317 рядків) ➔ винесення степів форми та валідаторів.
   - `apps/desktop/src/hooks/useQuotaReconciliation.ts` (315 рядків) ➔ винесення розрахунку дельти квот.
   - `apps/admin-portal/src/components/users/CreateUserDialog.tsx` (293 рядки) ➔ винесення форми користувача.

9. **CORE-03: Ліквідація залишків `any` у тестах**
   - [`apps/desktop/e2e/storage-backups.spec.ts:213`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/e2e/storage-backups.spec.ts#L213)
   - [`services/backend-api/test/suppliers.e2e-spec.ts:120`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/test/suppliers.e2e-spec.ts#L120)

10. **FE-01: Гарантія 100% дедуплікації запитів на клієнті (`useRef`)**
    - Аудит усіх дата-фетчинг хуків клієнта на наявність захисного прапорця `isFetchingRef.current` для усунення подвійних запитів у React 18.

---

## 3. Поетапний план реалізації (Roadmap)

### Етап 1: Критична безпека та захист ресурсів (P1)

- [x] 1.1. Видалити хардкод тестового секрету у `create-payment-invoice.handler.ts`, додати строгий fail-fast на відсутність ключів.
- [x] 1.2. Додати потоковий захист від OOM у `fetch-feed-url.handler.ts` (байтовий лічильник потоку з перериванням на >50MB).
- [x] 1.3. Впровадити захист від DNS Rebinding (TOCTOU SSRF) при парсингу фідів.
- [x] 1.4. Додати захист від race conditions для обробки вебхука `handle-wayforpay-webhook.handler.ts`.

### Етап 2: Швидкість та Кешування (P2)

- [x] 2.1. Додати TTL-кешування результату `JwtStrategy.validate` у Redis (60 сек).
- [x] 2.2. Підключити кешування тарифних планів (`plans`) та навігації (`navigation`) через `RedisCacheModule`.
- [x] 2.3. Впровадити механізм токен-ревокації (`auth:revoked_before`) для моментальної інвалідації JWT при зміні пароля або блокуванні акаунту.

### Етап 3: Рефакторинг, Модульність та Тести (P3)

- [x] 3.1. Декомпозувати компоненти `signup-form.tsx`, `useQuotaReconciliation.ts`, `CreateUserDialog.tsx` та `client.ts` під бюджет <250 рядків (`CORE-04`).
- [x] 3.2. Замінити `any` на суворі типи в `storage-backups.spec.ts` та `suppliers.e2e-spec.ts`.
- [x] 3.3. Перевірити проходження таргетних тестів сховища та клієнта.

---

## 4. Критерії приймання (Definition of Done)

1. 0 хардкодних тестових ключів у продакшн-обробниках платежів.
2. 0 шансів отримати OOM crash на віддалених потокових фідах.
3. Зниження навантаження на БД на ~70-80% під час повторних авторизованих запитів.
4. `tsc --noEmit` та `pnpm lint` завершуються з 0 помилок та 0 попереджень.
5. 100% збереження сумісності контрактів між Desktop клієнтом, Admin Portal та Backend API.
