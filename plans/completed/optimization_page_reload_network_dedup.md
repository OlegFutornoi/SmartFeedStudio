# Оптимізація та дедуплікація мережевих запитів при перезавантаженні сторінки (Page Reload Network Dedup)

**Статус**: Виконано (100% Verified)  
**Дата завершення**: 2026-10-15T19:04:00+03:00

---

## 1. Контекст та Проблема

При перезавантаженні сторінки (`F5` / reload) у браузері або десктопному клієнті фіксувався сплеск з 6–8+ одночасних HTTP-запитів до бекенду ще до відображення корисного контенту:

1. **Desktop Client**: кореневі провайдери (`AuthProvider`, `LicenseProvider`, `QuotasProvider`, `BackgroundJobsProvider`, `NavigationProvider`) одночасно відправляли незалежні запити (`/auth/me`, `/licenses/my`, `/quotas/my`, `/import-jobs/active`, `/navigation?targetApp=DESKTOP`).
2. **Сторінки**: `PlansPage` повторно запитувала `/licenses/my`, попри те, що `LicenseContext` вже виконав цей запит.
3. **Admin Portal**: дашборд виконував `Promise.all` з 5 окремих ендпоінтів (`/stats`, `/users`, `/payments/stats`, `/transactions`, `/licenses`).
4. **Desktop API Client**: відсутність `inFlightRequests Map` для склеювання ідентичних запитів у черзі.
5. **Порушення FE-01**: у `AuthContext.tsx` (`refreshProfile`) та `HomePage.tsx` (`loadSuppliers`) були відсутні `isFetchingRef` / `lastFetchedTokenRef`.

---

## 2. Порушені Архітектурні Інваріанти & Кодифікація Правил

- **`FE-01: Zero Duplicate API Calls via useRef`**: Впроваджено `isFetchingRef` та `lastFetchedTokenRef` у всіх хуках завантаження.
- **`FE-09: Client In-Flight Request Dedup`**: Додано до `.agents/rules/frontend.md` та `.agents/skills/vercel-react-best-practices/SKILL.md`.
- **`FE-10: Zero Duplicate Context Data Re-Fetching`**: Додано до `.agents/rules/frontend.md` та `.agents/skills/vercel-react-best-practices/SKILL.md`.
- **`FE-11: Aggregated Startup Bootstrap & Dashboard Overview`**: Додано до `.agents/rules/frontend.md` та `.agents/skills/vercel-react-best-practices/SKILL.md`.
- **`AGENT-03: Invariant & Skill Codification Loop`**: Додано до `.agents/rules/agents.md`.

---

## 3. Виконані Технічні Зміни

### Крок 1. In-Flight Request Deduplication в Desktop API Client

- **Файл**: `apps/desktop/src/lib/api/client.ts`
- **Зміна**: Реалізовано `inFlightRequests = new Map<string, Promise<Response>>()` для всіх GET-запитів з `resp.clone()`.

### Крок 2. Усунення дублювання викликів на сторінках (Context Reuse)

- **Файл**: `apps/desktop/src/hooks/usePlansPageData.ts` — повторний виклик `getMyLicense` замінено на готові дані з `useLicense()`.
- **Файл**: `apps/desktop/src/contexts/AuthContext.tsx` — додано `isFetchingRef` та `lastFetchedTokenRef` для `refreshProfile()`.
- **Файл**: `apps/desktop/src/pages/HomePage.tsx` — додано `isFetchingRef` та `lastFetchedTokenRef` для `loadSuppliers()`, вичищено залежності `useCallback`.

### Крок 3. Агрегація сесійного профілю (BFF Bootstrap Endpoint)

- **Контракт (`@smartfeed/shared`)**: `BootstrapResponseDto` у `packages/shared/src/dtos/auth.dto.ts`.
- **Бекенд**: `GetBootstrapQuery` + `GetBootstrapHandler` у `services/backend-api/src/modules/users/queries/` та маршрут `GET /auth/bootstrap` в `auth.controller.ts`.
- **Клієнти**: експортовано `getBootstrap` у десктопі та адмін-порталі.

### Крок 4. Агрегація метрик дашборду в Admin Portal

- **Контракт (`@smartfeed/shared`)**: `AdminDashboardOverviewDto` у `packages/shared/src/dtos/user.dto.ts`.
- **Бекенд**: `GetAdminDashboardOverviewQuery` + `GetAdminDashboardOverviewHandler` та маршрут `GET /users/dashboard-overview`.
- **Фронтенд**: `apps/admin-portal/src/app/(dashboard)/page.tsx` замінив 5 запитів на єдиний `api.getDashboardOverview()` з автоматичним graceful fallback.

---

## 4. Результати Верифікації та Тестування

1. **E2E Desktop Deduplication**:
   - `apps/desktop/e2e/network-dedup.spec.ts` — **2 passed (5.5s)**:
     - `1. Navigating to Plans page fires at most 1 /licenses/my request` ✓
     - `2. Navigating to Home page loads suppliers without redundant duplicate requests` ✓
2. **E2E Admin Portal Overview Aggregation**:
   - `apps/admin-portal/e2e/dashboard-overview-dedup.spec.ts` — **1 passed (6.4s)**:
     - `Dashboard loads via single aggregated overview endpoint without individual roundtrips` ✓
   - `apps/admin-portal/e2e/dashboard.spec.ts` — **4 passed (13.5s)** ✓
3. **Typecheck (`tsc --noEmit`)**:
   - `@smartfeed/shared`: build exit code 0 ✓
   - `backend-api`: exit code 0 (0 errors) ✓
   - `desktop`: exit code 0 (0 errors) ✓
   - `admin-portal`: exit code 0 (0 errors) ✓
