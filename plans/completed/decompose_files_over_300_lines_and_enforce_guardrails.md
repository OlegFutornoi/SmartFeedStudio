# 🛠️ План: Декомпозиція 20 файлів >300 рядків та ввімкнення `max-lines: error`

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 04.10.2026  
> **Ціль:** Декомпозиція всіх 20 файлів, які перевищують ліміт 300 рядків, доведення кожного файлу до ліміту <250–300 рядків, та переведення правила ESLint `max-lines` у статус `'error'`.

---

## 📊 1. Реєстр 20 файлів для декомпозиції

| Файл                                                      | Рядків (було) | Цільова архітектурна декомпозиція                                                                                                                   | Статус |
| :-------------------------------------------------------- | :-----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----: |
| **`DashboardRecentUsersTable.tsx`**                       |      462      | Виділено вкладки у субкомпоненти: `DashboardUsersTableTab.tsx`, `DashboardTransactionsTableTab.tsx`, `DashboardLicensesTableTab.tsx`                |   ✅   |
| **`comparisonTableConfig.tsx`**                           |      314      | Виділено в `comparisonCellRenderers.tsx`, `comparisonCategoriesInputOutput.tsx`, `comparisonCategoriesAdvanced.tsx`                                 |   ✅   |
| **`services/backend-api/prisma/seed.ts`**                 |      779      | Розбито на модульні сідери в `src/prisma/seeds/`: `tariffPlans`, `users`, `navigation`, `paymentSettings`                                           |   ✅   |
| **`services/backend-api/test/licenses.e2e-spec.ts`**      |      428      | Розділено на `licenses-lifecycle.e2e-spec.ts` та `licenses-limits.e2e-spec.ts`                                                                      |   ✅   |
| **`services/backend-api/test/organizations.e2e-spec.ts`** |      487      | Розділено на `organizations-seats.e2e-spec.ts` та `organizations-inheritance.e2e-spec.ts`                                                           |   ✅   |
| **`services/backend-api/test/payments.e2e-spec.ts`**      |      317      | Розділено на `payments-transactions.e2e-spec.ts` та `payments-webhooks.e2e-spec.ts`                                                                 |   ✅   |
| **`services/backend-api/test/users.e2e-spec.ts`**         |      357      | Розділено на `users-profile.e2e-spec.ts` та `users-admin.e2e-spec.ts`                                                                               |   ✅   |
| **`apps/admin-portal/e2e/api-contracts.spec.ts`**         |      400      | Винесено фікстуру `fixtures/api-contracts-mock-data.ts`, розділено на `api-contracts-urls.spec.ts` та `api-contracts-stability.spec.ts`             |   ✅   |
| **`apps/admin-portal/e2e/licenses.spec.ts`**              |      382      | Винесено `fixtures/licenses-mock-data.ts`, розділено на `licenses-table.spec.ts` та `licenses-actions.spec.ts`                                      |   ✅   |
| **`apps/admin-portal/e2e/payments.spec.ts`**              |      302      | Винесено `fixtures/payments-mock-data.ts`, скорочено до <285 рядків                                                                                 |   ✅   |
| **`apps/admin-portal/e2e/users.spec.ts`**                 |      333      | Винесено `fixtures/users-mock-data.ts`, розділено на `users-table.spec.ts` та `users-actions.spec.ts`                                               |   ✅   |
| **`apps/desktop/e2e/feature-teaser.spec.ts`**             |      357      | Винесено `fixtures/feature-teaser-mock-data.ts`, розділено на `feature-teaser-view.spec.ts` та `feature-teaser-sandboxes.spec.ts`                   |   ✅   |
| **`apps/desktop/e2e/feed-ingestion-engine.spec.ts`**      |      404      | Винесено `fixtures/feed-ingestion-mock-data.ts`, розділено на `feed-ingestion-wizard.spec.ts` та `feed-ingestion-cascade.spec.ts`                   |   ✅   |
| **`apps/desktop/e2e/plans.spec.ts`**                      |      517      | Винесено `fixtures/plans-mock-data.ts` та `plans-mock-routes.ts`, розділено на `plans-display.spec.ts` та `plans-checkout.spec.ts`                  |   ✅   |
| **`apps/desktop/e2e/pricing-rules-channels.spec.ts`**     |      342      | Винесено `fixtures/pricing-channels-mock-data.ts`, скорочено до 109 рядків                                                                          |   ✅   |
| **`apps/desktop/e2e/products-grid.spec.ts`**              |      363      | Винесено `fixtures/products-grid-mock-data.ts`, розділено на `products-grid-view.spec.ts` та `products-grid-actions.spec.ts`                        |   ✅   |
| **`apps/desktop/e2e/quota-reconciliation.spec.ts`**       |      356      | Винесено `fixtures/quota-reconciliation-mock-data.ts`, скорочено до 234 рядків                                                                      |   ✅   |
| **`apps/desktop/e2e/suppliers-feeds.spec.ts`**            |      769      | Винесено `fixtures/suppliers-feeds-mock-data.ts`, розділено на `suppliers-management.spec.ts`, `suppliers-datasync.spec.ts`, `feeds-wizard.spec.ts` |   ✅   |
| **`apps/desktop/e2e/team.spec.ts`**                       |      486      | Винесено `fixtures/team-mock-data.ts`, розділено на `team-members.spec.ts` та `team-invitations.spec.ts`                                            |   ✅   |
| **`apps/desktop/e2e/workspace-storage.spec.ts`**          |      377      | Винесено `fixtures/workspace-storage-mock-data.ts`, скорочено до 176 рядків                                                                         |   ✅   |

---

## 🏛 2. Архітектурні вимоги та інженерна дисципліна

1. **Zero Logic Loss**: Жоден тест, перевірка чи бізнес-правило не втрачено при декомпозиції.
2. **100% `@/` Path Aliases**: Усі нові субкомпоненти та модулі використовують префікс `@/` або `@smartfeed/shared`.
3. **Defense-in-Depth & Teardown**: Усі розділені тестові файли зберігають обов'язковий `cleanDatabase` у `beforeAll` та `afterAll`.
4. **Фасадні ре-експорти**: Збережено повну зворотну сумісність.

---

## 🪜 3. Поетапний план виконання (4 фази)

### Фаза 1. Декомпозиція вихідних файлів додатків (`src/` та `prisma/`)

- [x] Декомпозувати `DashboardRecentUsersTable.tsx` (винесено 3 субтаблиці).
- [x] Декомпозувати `comparisonTableConfig.tsx` (винесено рендерери клітинок та категорії).
- [x] Декомпозувати `services/backend-api/prisma/seed.ts` (винесено сідери в `src/prisma/seeds/`).
- [x] Перевірити `pnpm --filter admin-portal exec tsc --noEmit` та `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.

### Фаза 2. Декомпозиція тестів бекенду (`services/backend-api/test/`)

- [x] Розділити 4 e2e-тести на модульні сьюти (<300 рядків кожен).
- [x] Перевірити: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.

### Фаза 3. Декомпозиція E2E тестів фронтенду (`apps/admin-portal/e2e/` та `apps/desktop/e2e/`)

- [x] Декомпозувати тести `admin-portal/e2e`: `api-contracts.spec.ts`, `licenses.spec.ts`, `payments.spec.ts`, `users.spec.ts`.
- [x] Декомпозувати тести `desktop/e2e`: `feature-teaser.spec.ts`, `feed-ingestion-engine.spec.ts`, `plans.spec.ts`, `pricing-rules-channels.spec.ts`, `products-grid.spec.ts`, `quota-reconciliation.spec.ts`, `suppliers-feeds.spec.ts`, `team.spec.ts`, `workspace-storage.spec.ts`.
- [x] Перевірити: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`.

### Фаза 4. Активація `max-lines: error` та фінальна валідація

- [x] Перемкнути `max-lines` у `eslint.config.mjs` на `'error'`.
- [x] Запустити `pnpm lint` -> 0 errors, 0 warnings.
- [x] Запустити `pnpm format`.
- [x] Оновити реєстри та перенести план у `plans/completed/`.
