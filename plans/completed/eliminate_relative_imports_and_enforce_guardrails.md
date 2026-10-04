# 🛠️ План: Ліквідація 728 відносних імпортів та переведення `no-restricted-imports` у `error`

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 04.10.2026  
> **Ціль:** 100% ліквідація всіх 728 попереджень `no-restricted-imports`, налаштування path aliases (`@/`, `@e2e/`, `@test/`), та переведення правила ESLint `no-restricted-imports` у статус `error` (Zero-Broken-Build Gate).

---

## 📊 1. Аналіз поточного стану (728 порушень)

Аналіз за допомогою ESLint показав такий розподіл по кодовій базі:

| Область                                     | Кількість | Тип імпортів                                        | Цільове архітектурне рішення                                                                                                 |
| :------------------------------------------ | :-------: | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **`apps/desktop/src`**                      | **~310**  | `../`, `./` між компонентами, хуками, сервісами     | Заміна на `@/components/...`, `@/hooks/...`, `@/services/...`                                                                |
| **`apps/admin-portal/src`**                 | **~190**  | `../`, `./` між компонентами, контекстами           | Заміна на `@/components/...`, `@/contexts/...`, `@/lib/...`                                                                  |
| **`services/backend-api/src`**              | **~116**  | `../`, `./` між модулями, контролерами              | Заміна на `@/modules/...`, `@/prisma/...`, `@/common/...`                                                                    |
| **`services/backend-api/test` & `prisma/`** |  **~44**  | `../src/...`, `./utils/...`                         | `@/` для `src/*`, `@test/` для хелперів тестів                                                                               |
| **`apps/*/e2e`**                            |  **~36**  | `./fixtures/...`, `../pages/...`                    | Налаштування path alias `@e2e/*` для Page Object Model                                                                       |
| **`packages/shared`**                       |  **32**   | Внутрішній експорт бібліотеки (`./dtos`, `./enums`) | Внутрішні модулі бібліотеки без бандлера — виключення з правила у `eslint.config.mjs` (бо `tsc` не переписує `@/` в `dist/`) |

---

## 🏛 2. Архітектурні вимоги та захист від збоїв (Defense-in-Depth)

1. **Цілісність збірок**:
   - `packages/shared`: компілюється через чистий `tsc` у `dist/`. Використання `@/` всередині npm-пакета без бандлера призводить до `MODULE_NOT_FOUND` у споживачів (`backend-api`, `desktop`). Тому в `eslint.config.mjs` для `packages/shared/**` правило відключається.
2. **Path Aliases у tsconfig.json**:
   - `services/backend-api`: додається `"@test/*": ["test/*"]`, а в `jest-e2e.json` — `"^@test/(.*)$": "<rootDir>/test/$1"` та `"^@/(.*)$": "<rootDir>/src/$1"`.
   - `apps/admin-portal`: додається `"@e2e/*": ["./e2e/*"]` у `tsconfig.json`.
   - `apps/desktop`: додається `"@e2e/*": ["e2e/*"]` у `tsconfig.json`.
3. **Failure Modes & Edge Cases**:
   - Якщо файл містить відносний CSS-імпорт (наприклад `import './globals.css'`), заміна на `import '@/app/globals.css'`.
   - Якщо файл містить циклічний імпорт через фасад `index.ts`, використовується прямий шлях до конкретного файлу модуля (наприклад `@/modules/users/users.service`).
   - Автоматизована скриптова заміна виконується з обов'язковою верифікацією типізації через `tsc --noEmit`.

---

## 🪜 3. Поетапний план виконання (5 кроків)

### Крок 1. Конфігурація Path Aliases та ESLint

- [ ] Оновити `services/backend-api/tsconfig.json` та `test/jest-e2e.json` (додати `@test/*` та перевірити `@/*`).
- [ ] Оновити `apps/admin-portal/tsconfig.json` (додати `@e2e/*`).
- [ ] Оновити `apps/desktop/tsconfig.json` (додати `@e2e/*`).
- [ ] Оновити `eslint.config.mjs`: додати секцію overrides для `packages/shared/**` (`'no-restricted-imports': 'off'`).

### Крок 2. Автоматизована міграція імпортів у `services/backend-api`

- [ ] Запустити безпечний Node.js скрипт для резолву відносних шляхів `../` та `./` у канонічні `@/` (для `src`) та `@test/` (для `test`).
- [ ] Оновити `prisma/seed.ts` та `prisma/set-admin.ts` на `@/generated/prisma/client`.
- [ ] Перевірити: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.

### Крок 3. Автоматизована міграція імпортів у `apps/admin-portal`

- [ ] Виконати заміну відносних імпортів у `src/` на `@/...` та в `e2e/` на `@e2e/...`.
- [ ] Перевірити: `pnpm --filter admin-portal exec tsc --noEmit`.

### Крок 4. Автоматизована міграція імпортів у `apps/desktop`

- [ ] Виконати заміну відносних імпортів у `src/` на `@/...` та в `e2e/` на `@e2e/...`.
- [ ] Перевірити: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`.

### Крок 5. Переведення правила в `error` та фінальна валідація

- [ ] Змінити `'no-restricted-imports'` з `'warn'` на `'error'` у `eslint.config.mjs`.
- [ ] Запустити `pnpm lint` і підтвердити **0 помилок** `no-restricted-imports`.
- [ ] Запустити повну перевірку `pnpm build` та тести `pnpm --filter @smartfeed/backend-api test:e2e`.
- [ ] Оновити статус у `plans/active/skills_rollout_plan.md`.

---

## 🛡️ Definition of Done (DoD)

- [ ] `no-restricted-imports` у `eslint.config.mjs` встановлено в `'error'`.
- [ ] `pnpm lint` проходить без жодного попередження чи помилки `no-restricted-imports`.
- [ ] `tsc --noEmit` успішний для всіх пакетів монорепозиторію.
- [ ] E2E тести бекенду проходять (100% PASS).
