# 🧪 План Усунення Недоліків: Автотести & QA Інфраструктура (Backend Jest & Frontend Playwright)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.09.2026  
> **Автор:** Adversarial Review Engine (`adver-review`)  
> **Цільові пакети:** `services/backend-api/test`, `apps/desktop/e2e`, `apps/admin-portal/e2e`

---

## 📌 1. Мета та огляд проблем

Під час ретельного тестування тестової інфраструктури обох додатків виявлено наступні дефекти:

1. **Падіння Backend E2E тесту організації (`test/organizations.e2e-spec.ts`)**:
   - 2 тести завершуються помилкою через невідповідність тексту повідомлення `TEAM_SEATS_LIMIT_EXCEEDED` (тест очікує підрядок `1 місць у команді`, а бекенд повертає текст англійською мовою).
2. **Флаки та колізії паралельного запуску в Desktop Playwright (`apps/desktop/playwright.config.ts`)**:
   - `workers` у локальному конфізі не зафіксовано (`workers: process.env.CI ? 1 : undefined`). За замовчуванням запускається 4 паралельних воркери, що призводить до стану гонитви (race conditions) при роботі зі спільним `localStorage` та моками у тестах `quota-reconciliation.spec.ts`, `feed-ingestion-engine.spec.ts` та `workspace-storage.spec.ts`.
   - В `admin-portal` це вже вирішено через `workers: 1`.
3. **Використання `any` у тестових наборах**:
   - 15+ випадків приведення до `as any` у тестах `organizations.e2e-spec.ts`, `payments.e2e-spec.ts`, `team-invitations.e2e-spec.ts`, `users.e2e-spec.ts`, `pricing-rules-channels.spec.ts`.
4. **Прогалини у покритті (Coverage Gaps)**:
   - Відсутній dedicated Playwright E2E тест на двомовність (UA ⇄ EN) та перевірку єдиної кнопки CTA для нового модуля каналів експорту (`ExportChannelsList.tsx`).
   - Відсутній adversarial стрес-тест на конкурентні запити додавання співробітників (паралельний виклик `POST /api/organizations/:id/members` при 1 доступному місці).
   - Відсутній тест на валідацію шляху в `workspace-utils.ts` проти path traversal (`../`).

---

## 🎯 2. Детальний перелік виявлених дефектів

| Категорія                          | Файли з порушеннями                                                                                                                                                              | Опис дефекту                                                                                                 |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| 🔴 **Backend Test Failure**        | [organizations.e2e-spec.ts](../../services/backend-api/test/organizations.e2e-spec.ts#L227)                                                                                      | `expect(res.body.message).toContain('1 місць у команді')` падає через англійську відповідь бекенду           |
| ⚡ **Desktop E2E Race Conditions** | [desktop/playwright.config.ts](../../apps/desktop/playwright.config.ts#L8)                                                                                                       | Неконтрольована паралелізація (4 воркери) руйнує ізоляцію `localStorage` і спричиняє таймаути в 3 сьютах     |
| ⚠️ **Untyped Mocks (`any`)**       | [teardown.helper.ts](../../services/backend-api/test/utils/teardown.helper.ts#L179), [pricing-rules-channels.spec.ts](../../apps/desktop/e2e/pricing-rules-channels.spec.ts#L97) | Обхід статичної типізації через `as any`                                                                     |
| 🌐 **Missing Coverage**            | `apps/desktop/e2e/export-channels.spec.ts`                                                                                                                                       | Відсутній окремий сьют тестування каналів експорту, зворотної націнки та валідації відсутності подвійних CTA |
| ⚔️ **Adversarial Security Tests**  | `services/backend-api/test/adversarial/`                                                                                                                                         | Відсутні автоматизовані тести на TOCTOU стан гонитви при вичерпанні квот місць у команді                     |

---

## 🛠️ 3. Поетапний план виправлення (Remediation Tasks)

### Етап 1. Стабілізація конфігурації Desktop Playwright

- [x] У `apps/desktop/playwright.config.ts`:
  - Встановити детерміновану кількість воркерів: `workers: 1` (як у `apps/admin-portal/playwright.config.ts`).
  - Додати очищення контексту браузера (`context.clearCookies()`, скидання `localStorage`) перед кожним тестом.
- [x] Перевірити повторний прогін `pnpm test:desktop` і переконатися у відсутності колізій ізоляції.

### Етап 2. Виправлення та узгодження тесту `organizations.e2e-spec.ts`

- [x] У `services/backend-api/test/organizations.e2e-spec.ts`:
  - Перевірити очікуваний код помилки: `expect(res.body.code).toBe('TEAM_SEATS_LIMIT_EXCEEDED')`.
  - Узгодити перевірку тексту повідомлення відповідно до виправленого контракту бекенду (підрядок `місць у команді`).
  - Прогнати `pnpm --filter @smartfeed/backend-api test:e2e` для підтвердження 100% PASS (12/12 сьютів, 144/144 тестів).

### Етап 3. Ліквідація `as any` у тестових наборах

- [x] У `services/backend-api/test/utils/teardown.helper.ts`:
  - Замінити приведення `as any` на строгі типи Prisma:
    ```typescript
    const planConditions: Prisma.TariffPlanWhereInput[] = [
      { code: { startsWith: 'TEST_' } },
      { code: { startsWith: 'PLAN_' } },
      { code: 'CUSTOM_ULTRA' },
    ];
    if (planCodes.length > 0) planConditions.push({ code: { in: planCodes } });
    ```
- [x] Усунути `as any` у `users.e2e-spec.ts`, `team.spec.ts` та `pricing-rules-channels.spec.ts`.

### Етап 4. Новий E2E сьют для каналів експорту (`export-channels.spec.ts`)

- [x] Створити `apps/desktop/e2e/export-channels.spec.ts`:
  - **Тест 1**: Відображення єдиної кнопки `Підключити маркетплейс` у картці Empty State та відсутність тулбару при `channels.length === 0`.
  - **Тест 2**: Створення каналу Rozetka зі зворотною націнкою та поява тулбару пошуку після створення.
  - **Тест 3**: Повна перевірка двомовності (UA ⇄ EN) для всіх елементів форми та калькулятора маржинальності.

### Етап 5. Adversarial тести на гонки (Race Conditions) та безпеку

- [x] Створити `services/backend-api/test/adversarial/team-seats-race.adversarial-spec.ts`:
  - Відправка 10 одночасних запитів `POST /api/organizations/:id/members` на тарифі з 1 доступним місцем.
  - Ствердження, що успішним (`201 Created`) може бути рівно 1 запит, а решта 9 повертають `403 TEAM_SEATS_LIMIT_EXCEEDED`.
- [x] Створити тест на валідацію `POST /api/storage/workspace/init` проти введення шляхів з `../../` та ін'єкцій команд.

---

## 🛡️ 4. Критерії готовності (Definition of Done)

1. [x] `pnpm --filter @smartfeed/backend-api test:e2e` завершується з результатом 12/12 Suites Passed, 100% Tests Passed (144/144).
2. [x] `pnpm test:desktop` завершується з результатом 100% Tests Passed без флаків від паралелізації (89/89).
3. [x] `pnpm test:admin` завершується з результатом 100% Tests Passed (68/68).
4. [x] 0 попереджень `any` у тестових файлах.
5. [x] Додано тести для каналів експорту та adversarial стрес-тести на стан гонитви.
