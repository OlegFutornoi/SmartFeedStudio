# Map — де що лежить

| Домен                      | Місце                                                        | Примітка                                         |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Контракти (DTO, Zod, enum) | `packages/shared`                                            | `pnpm build:shared` після змін                   |
| Backend API (:4000)        | `services/backend-api/src/modules/*`                         | CQRS: `commands/`, `queries/`, `events/`, `dto/` |
| Prisma схема               | `services/backend-api/prisma/schema.prisma`                  | snake_case `@@map`, FK-індекси                   |
| Backend E2E                | `services/backend-api/test/*.e2e-spec.ts`                    | `cleanDatabase` teardown                         |
| Admin Portal (:3000)       | `apps/admin-portal`                                          | Next.js 14, хмарний бекенд                       |
| Desktop UI (:1420)         | `apps/desktop/src`                                           | React 18, API-клієнти `@/services/api/*`         |
| Desktop native             | `apps/desktop/src-tauri/src` (`db.rs`)                       | SQLCipher, Keychain                              |
| Mock/local драйвер         | `mockDatabaseDriver`, `LocalProductsService`                 | паритет з реальним бекендом                      |
| Playwright E2E             | `apps/*/e2e`                                                 | POM, `data-testid`                               |
| Документація               | `wiki/0X-*`, `AGENTS.md`, `plans/{active,backlog,completed}` |                                                  |
| Правила/скіли/агенти       | `.agents/rules`, `.agents/skills`, `.agents/agents_*.md`     | rules <12k символів                              |

## Потоки

- Desktop: UI → `@/services/api/*` → (Tauri `invoke` → SQLite) **або** (HTTP → NestJS) — режими мають давати однаковий результат.
- Admin: UI → HTTP → NestJS → CommandBus/QueryBus → Prisma → PostgreSQL.
- Імпорт фіда: URL → fetch → стрім-парсинг → товари/категорії → лічильники.

> Точні шляхи уточнювати `grep`/`list_dir`; карта дає лише напрямок.
