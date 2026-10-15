# Комплексний аудит та усунення надлишкових запитів, дублів та 404 помилок при навігації по меню

**Дата створення**: 2026-10-15T19:10:00+03:00  
**Оновлено**: 2026-10-15T19:30:00+03:00  
**Статус**: ✅ Реалізовано та верифіковано (100% тестів PASS)  
**Автор**: @agents_review & @agents_frontend

---

## 1. Аналіз Network Panel (112 запитів при навігації туди й назад)

При послідовному переході по розділах меню:
`Дашборд` -> `Каталоги` -> `Постачальники` -> `AI` -> `Хмарне сховище` -> `Тарифи` -> `Налаштування` і назад було зафіксовано **112 HTTP-запитів**:

1. **404 Помилки (2 ендпоінти)**:
   - `GET /api/page-guides/dashboard` -> 404 Not Found (клієнт надсилав `dashboard`, а в `DEFAULT_PAGE_GUIDES` ключ `'/'`).
   - `GET /api/page-guides/plans` -> 404 Not Found (клієнт надсилав `plans`, а в `DEFAULT_PAGE_GUIDES` ключ `'/license'`).
2. **Повна відсутність клієнтського кешування (TTL / SWR) при навігації**:
   - При кожному кліку на `Тарифи` (`/plans`) виконувався прямий `fetch('/api/plans')`.
   - При кожному кліку на `Постачальники` (`/suppliers`) та поверненні на `Дашборд` (`/`) знову викликався `/api/suppliers`.
   - При переході на `Хмарне сховище` (`/cloud-sync`) знову викликався `/api/storage/quota`.
3. **Лавинне скидання кешу через `useDataSync('all')`**:
   - `useAiAssistantProfile` та `useStorageQuota` слухали глобальну подію `'all'`.
   - Будь-який модуль, що надсилав `emitDataSync('all')` при монтуванні, інвалідував `cachedGuides = {}` та кеш квот, примушуючи всі екрани повторно завантажувати дані через мережу.
4. **Обхід дедуплікатора через «сирий» `fetch`**:
   - `page-guides.ts`, `licenses.ts` (`getTariffPlans`) та `storage.ts` викликали нативний браузерний `fetch()`, оминаючи глобальний `inFlightRequests Map` у `client.ts`.
5. **Повторний запуск фонових задач**:
   - `BackgroundJobsContext` перезапускав `refreshActiveJobs` при кожній зміні квот або провайдерів.

---

## 2. Кореневі причини (Root Causes)

| Проблема                                | Файл                                                  | Коренева причина                                                                             |
| :-------------------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **404 `/page-guides/dashboard`**        | `page-guides.ts` / `get-page-guides.handler.ts`       | Клієнт надсилає `dashboard`, бекенд шукає `DEFAULT_PAGE_GUIDES['/dashboard']` замість `'/'`. |
| **404 `/page-guides/plans`**            | `page-guides.ts` / `get-page-guides.handler.ts`       | Клієнт надсилає `plans`, бекенд шукає `DEFAULT_PAGE_GUIDES['/plans']` замість `'/license'`.  |
| **3x `/page-guides/assistant/profile`** | `services/page-guides.ts`, `useAiAssistantProfile.ts` | Сирий `fetch`, відсутній in-flight dedup, підписка на `['settings', 'all']` скидає кеш.      |
| **Дублі при перемиканні вкладок меню**  | `licenses.ts`, `suppliers.ts`, `storage.ts`           | Відсутність легкого in-memory TTL (SWR) кешу для статичних довідників та списків.            |
| **2x `/feeds/jobs/active`**             | `BackgroundJobsContext.tsx`                           | Нестабільне посилання `refreshActiveJobs` через залежність від `refreshQuotas`.              |

---

## 3. Нові архітектурні інваріанти

- **`FE-12: Zero Raw Fetch Bypasses in Services`**: Усі фронтенд-сервіси зобов'язані використовувати `fetchWithAuth`. Використання нативного `fetch` заборонено (виключає 401 refresh та in-flight dedup).
- **`FE-13: Scoped Domain DataSync Subscriptions`**: Заборонено підписувати хуки та компоненти на категорію `'all'` у `useDataSync`, якщо компонент реагує лише на вузький домен (наприклад, тільки `'settings'`).
- **`FE-14: In-Memory TTL & Navigation Cache for Reference Data`**: Статичні та напівстатичні довідники (тарифні плани, довідники сторінок page-guides, налаштування, постачальники) повинні кешуватися в пам'яті (TTL 30-300 сек) для виключення мережевих запитів при перемиканні між пунктами меню.

---

## 4. Виконана реалізація та результати верифікації

### Етап 1. Усунення обох 404 помилок на бекенді та фронтенді

- **Бекенд**: у `GetPageGuidesHandler` додано аліаси:
  - `/dashboard` -> `/`
  - `/plans` -> `/license`
  - `/license` -> `/plans`
- **Фронтенд**: у `apps/desktop/src/services/page-guides.ts` усі виклики переведено на `fetchWithAuth` з in-flight promise deduplication та TTL 2 хвилини.
- **E2E тест**: `services/backend-api/test/page-guides.e2e-spec.ts` (6/6 PASS).

### Етап 2. Ліквідація дублювання AI Assistant Profile та Page Guides

- У `page-guides.ts`: об'єднано паралельні запити профілю через єдиний in-flight Promise `pendingProfilePromise`.
- У `useAiAssistantProfile.ts`: додано `isFetchingRef` / `lastFetchedTokenRef` та звужено `useDataSync` strictly до `['settings']`.

### Етап 3. TTL Кешування тарифів, постачальників та сховища

- У `apps/desktop/src/lib/api/licenses.ts`: `getTariffPlans()` переведено на `fetchWithAuth` з TTL-кешем на 5 хвилин.
- У `apps/desktop/src/lib/api/suppliers.ts`: додано in-memory навігаційний кеш `cachedSuppliers` на 30 секунд з інвалідацією на мутаціях.
- У `apps/desktop/src/services/storage.ts`: `getStorageQuota` переведено на `fetchWithAuth` з TTL 60 секунд.
- У `BackgroundJobsContext.tsx`: стабілізовано `refreshActiveJobs`, прибравши `refreshQuotas` із залежностей через `refreshQuotasRef`.

### Етап 4. Комплексна верифікація та E2E тести

- `apps/desktop/e2e/network-dedup.spec.ts` (3/3 PASS):
  1. `Navigating to Plans page fires at most 1 /licenses/my request`
  2. `Navigating to Home page loads suppliers without redundant duplicate requests`
  3. `Full navigation across tabs reuses in-memory cache with zero duplicate requests (FE-14)`
- Повний typecheck мокрорепозиторію:
  - `@smartfeed/shared`: `tsc` PASS (код 0)
  - `@smartfeed/desktop`: `tsc --noEmit` PASS (код 0)
  - `@smartfeed/admin-portal`: `tsc --noEmit` PASS (код 0)
  - `@smartfeed/backend-api`: `tsc --noEmit` PASS (код 0)
