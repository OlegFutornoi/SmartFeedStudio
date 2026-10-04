# Routing Matrix — задача → мінімальний набір скілів

| Тип задачі                 | Обов'язкові скіли                                                                        | Додатково за умовою                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Нова таблиця/поле/індекс   | `supabase-postgres-best-practices`, `prisma-client-api`, `prisma-cli`                    | `db-migrations-zero-downtime`, `postgresql-code-review`, `postgresql-optimization`                                                   |
| Новий CQRS-ендпоінт        | `contract-first-api`, `nestjs-best-practices`, `defense-in-depth-validation`             | `idempotency-and-outbox`, `api-security-best-practices`, `subscription-lifecycle`                                                    |
| Видалення сутності/фіда    | `defense-in-depth-validation`, `sentry-backend-bugs`, `inversion-exercise`               | `mock-real-parity-testing`, `invariant-checklist-generator` (каскад + лічильники)                                                    |
| Імпорт великих фідів       | `streaming-large-feeds`, `idempotency-and-outbox`, `property-based-and-mutation-testing` | `scale-game`, `backend-patterns`, `sentry-backend-bugs`, `seed-and-fixtures-factory`                                                 |
| Новий екран/модалка        | `frontend`, `ui-ux-pro-max`, `shadcn`, `tailwind-design-system`                          | `emil-design-eng`, `beautiful-design` (полірування)                                                                                  |
| Десктоп/Tauri/IPC/Ключі    | `tauri-v2-security-and-ipc`, `frontend`                                                  | `collision-zone-thinking`, `mock-real-parity-testing`                                                                                |
| Дані з API в UI            | `contract-first-api`, `integrate-backend`, `vercel-react-best-practices`                 | `mock-real-parity-testing`, `frontend_network_dedup` (1 запит на завантаження)                                                       |
| Тести UI                   | `playwright-best-practices`, `condition-based-waiting`, `testing-anti-patterns`          | `visual-regression-testing`, `accessibility-testing`, `mock-real-parity-testing`, `e2e-scenario-matrix`, `seed-and-fixtures-factory` |
| Продуктивність/Бюджети     | `performance-budget`, `vercel-react-best-practices`                                      | `streaming-large-feeds`, `postgresql-optimization`                                                                                   |
| Реліз / Відкат             | `release-and-rollback`, `db-migrations-zero-downtime`, `contract-first-api`              | `observability-opentelemetry`, `verification-before-completion`, `finishing-a-development-branch`                                    |
| Баг/регресія               | `systematic-debugging`, `root-cause-tracing`                                             | `observability-opentelemetry`, `when-stuck-problem-solving-dispatch`                                                                 |
| Аудит/рев'ю                | `fullstack-code-review`, `adver-review`, `requesting-code-review`                        | `e2e-scenario-matrix`, `accessibility-testing`, `performance-budget`                                                                 |
| План фічі                  | `writing-plans`, `invariant-checklist-generator`                                         | `executing-plans` після команди «починай»                                                                                            |
| Наскрізна фіча (Fullstack) | `fullstack-feature-orchestrator`, `contract-first-api`, `invariant-checklist-generator`  | `mock-real-parity-testing`, `adver-review`, `verification-before-completion`                                                         |
| Нове правило/скіл/аудит    | `skill-creator`, `writing-skills`, `skill-health-audit`                                  | `testing-skills-with-subagents`, `gardening-skills-wiki`                                                                             |

## Правила вибору

1. Береться рядок(и) за типом; решта скілів не читається.
2. Фіча на обидва шари: спочатку контракти `@smartfeed/shared`, потім backend RED→GREEN, потім frontend.
3. Паралельні незалежні підзадачі — `dispatching-parallel-agents`.
