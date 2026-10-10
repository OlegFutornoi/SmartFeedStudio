# Каталог guardrails

| Правило                                  | Механізм                                                        | Стан                                                             |
| ---------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Без `../` та `./` імпортів               | ESLint `no-restricted-imports` (patterns) у `eslint.config.mjs` | warn (728 наявних порушень на 04.10.2026) → error після очищення |
| Файл ≤300 рядків                         | ESLint `max-lines` (skip blank/comments)                        | warn (20 файлів >300 на 04.10.2026)                              |
| Без `as any`                             | `@typescript-eslint/no-explicit-any`                            | warn → error                                                     |
| Без порожніх `catch {}`                  | `no-empty` без `allowEmptyCatch`                                | потребує вирішення                                               |
| Без hardcoded purple/violet/fuchsia/pink | grep-перевірка у CI (`rg "(purple                               | violet                                                           | fuchsia | pink)-\d"`) | планується |
| Один виклик API на завантаження          | Playwright request-count тест                                   | у тестах                                                         |
| Теardown даних                           | `cleanDatabase` у `beforeAll/afterAll`                          | ревʼю                                                            |
