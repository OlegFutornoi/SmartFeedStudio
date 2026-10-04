---
trigger: always_on
description: Mandatory testing standards, test isolation, data cleanup, git commit policy, i18n rules, and verification checklist.
---

# 🛡️ SmartFeed Studio — Testing, Quality & Operational Rules

## 📌 1. Git Commit & Push Policy (Explicit User Trigger Only)

- **Strict Prohibition**: The agent must **NEVER** automatically perform `git commit` or `git push` immediately after making changes or fixes.
- All changes must be tested and verified locally, and presented to the user.
- Staging, committing, and pushing must occur **strictly** upon the user's explicit request (e.g., `/git-commit`, `/commit`, _"вивантаж"_, _"закоміть"_).

---

## 🧼 2. Mandatory Test Isolation & Complete Data Cleanup Policy (Zero Leftovers)

- **Zero Test Data Leftovers**: Every automated test (Backend Jest E2E, Integration, Desktop/Admin Playwright E2E) that creates, modifies, or stores records (database users, licenses, organizations, members, invitations, navigation items, snapshots, product images, future product/feed catalogs, files in object storage, localStorage, cookies) **MUST** guarantee 100% complete deletion and teardown of all test-generated data.
- **Backend Database Teardown**: In all `*.e2e-spec.ts` files, tests **MUST** use the centralized `cleanDatabase` helper (`test/utils/teardown.helper.ts`) in both `beforeAll` (pre-clean) and `afterAll` (post-clean). The deletion strictly follows the FK-safe hierarchy:
  1. `Snapshot` & `ProductImage` (catalogs, XML feeds, media, future `Product` / `Feed` entities)
  2. `OrganizationInvitation` (invitation tokens, emails)
  3. `OrganizationMember` (team memberships)
  4. `License` (all user and organization licenses)
  5. `Organization` (test companies)
  6. `User` (test users by IDs, emails, wildcard prefixes)
  7. `TariffPlan` & `NavigationItem` (test-created plans and navigation items)
     Never leave orphaned rows in PostgreSQL or Redis.
- **Frontend Test Isolation**: In Playwright E2E tests (`*.spec.ts`), always clear browser `localStorage`, `sessionStorage`, cookies, and route mocks before and after each test case to prevent state leakage.

---

## 🌐 3. Mandatory 100% Internationalization (i18n) & Dedicated UI Localization Tests

- **Zero Hardcoded Strings & Zero Untranslated Keys**: Whenever any new feature, UI screen, dialog, form, button, label, alert, placeholder, toast, tooltip, HTML title (`title={t('...')}`), or backend error message is created or modified:
  - **Immediate Bilingual Translation**: Define all keys in both `uk` (Ukrainian) and `en` (English) locale dictionaries (`locales/uk/*.json`, `locales/en/*.json`). Always verify that every `t('namespace:key')` or `t('key')` has an existing entry so that raw keys (e.g. `common:edit`) NEVER appear in the UI.
  - **Backend Error Mapping**: All error responses from the API must be intercepted, mapped, and translated via `getErrorMessage` or localized error helpers so that no raw English backend strings leak into the Ukrainian UI.
- **Mandatory UI Localization Tests**: Every new or updated frontend feature/view **MUST** include dedicated Playwright UI tests explicitly asserting that all interactive elements, titles, descriptions, placeholders, and alerts dynamically update and translate when switching languages (`UA` ⇄ `EN`).

---

## 🎯 4. Real Business Invariants in Frontend & E2E Tests (Zero Superficial Assertions)

- **Повна заборона фіктивних «smoke-only» тестів**:
  - Тести Playwright для клієнтських додатків НЕ мають права обмежуватися лише перевіркою «чи відрендерилась сторінка» або «чи є таблиця».
  - Тести ЗОБОВ'ЯЗАНІ перевіряти реальну бізнес-логіку та інваріанти даних:
    1. **Реальні назви сутностей**: обов'язковий `expect` на конкретні дані (наприклад, реальна назва постачальника `Brain Distribution` або `MMM`), і **строгий `expect(text).not.toBe('Постачальник')`** для унеможливлення витоку назв колонок як значень.
    2. **Каскадне видалення та цілісність**: тести життєвого циклу зобов'язані перевіряти, що після видалення фіду кількість товарів зменшується, товари цього фіду зникають з таблиці, а лічильники та квоти зменшуються.
    3. **Паритет середовищ**: один і той самий набір бізнес-правил має валідуватися для Mock і Real режимів.

---

## 📏 5. Rule Files Size Limit & Continuous Modularization Policy (Max 12,000 Chars)

- **Hard Limit**: Every rule file in `.agents/rules/*.md` **MUST NEVER exceed 12,000 characters** (Antigravity IDE hard limit).
- **Continuous Modularization**: Whenever any rule file reaches ~10,000–11,000 characters, the agent **MUST** split the rules or create a new dedicated `.md` file in `.agents/rules/` with `trigger: always_on` (e.g. `testing_and_quality.md`, `commands.md`, `plans_lifecycle.md`, etc.).
- **Zero Drift**: The agent **MUST ALWAYS** discover, read, and strictly follow all rule files located in `.agents/rules/` without exception.

---

## ✅ 5. Mandatory Verification Protocol & Commands

Immediately after writing or modifying code in ANY package, execute static typechecking and verification:

- Backend API: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
- Shared contracts: `pnpm --filter @smartfeed/shared build`
- Prisma schema changes: `pnpm --filter @smartfeed/backend-api exec prisma generate`
- Desktop App: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`
- Admin Web Portal: `pnpm --filter admin-portal exec tsc --noEmit`
- Auto-Formatting: `pnpm format` (Prettier)
