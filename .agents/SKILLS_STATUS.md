# Реєстр верифікації та дрифту скілів (.agents/skills/)

Цей документ автоматично фіксує статус валідації та контролює зміни (дрифт) скілів SmartFeed Studio.

## 1. Зведений стан каталогу скілів

- Всього скілів: 43
- [VERIFIED] Перевірено з реальними LLM: 17
- [MODIFIED] Змінено після останньої перевірки (потрібен повторний прогін): 0
- [UNVERIFIED] Очікують перевірки з LLM (структурно валідні): 25
- [FAILED] Помилка останнього прогону: 1
- Дата останньої синхронізації: 2026-11-01

## 2. Статус кожного скіла

- `ai-sdk`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 6a6eb02099e9eb45)
- `api-anything`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 6d4382e633797ef6)
- `api-security-testing`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 458bbe9347b7093c)
- `backend`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 424a4ef9d15ebe6a)
- `brainstorming`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 3128c68aaefd48f9)
- `browser-debugging`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 5e9b3b14dec44066)
- `bullmq-jobs`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: b77e4ae0e9c72f43)
- `ci-cd-and-automation`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: f63bc14e18fe1d4f)
- `code-simplification`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 1e89916702d007a7)
- `contract-first-api`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 29343421378c1167)
- `documentation-and-adrs`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: aa9c78c2f3324f58)
- `doubt-driven-development`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 455a0ad4fa5e350d)
- `find-skills`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 2c54954635fe66cc)
- `firecrawl-parse`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 997d8da202807339)
- `frontend`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: d3eb4acae594442a)
- `git-commit`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: 8879387908bf6019)
- `headroom-compression`: [VERIFIED] (LLM: omniroute, Score: 3/3, Data: 2026-11-01, Hash: abceb3abfd1abeb4)
- `i18n-localization`: [FAILED] (Остання оцінка: 2/3, Помилка прогону)
- `incremental-implementation`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: c2d99709fd36f12a)
- `lessons-learned-registry`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: a1747417b680341f)
- `mcp-knowledge-cache`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 8451856193126370)
- `mock-real-parity`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: c3cef02f66681f66)
- `nestjs-best-practices`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: e6d10857afcbfb40)
- `observability-and-instrumentation`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 20fe716035d91c83)
- `omniroute-delegation`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 4afedd5f76844ce4)
- `performance-optimization`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: aca0ac08d333d3c5)
- `perplexity-agent-api`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 7b5fe889fabb121c)
- `planning-and-lifecycle`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 5b34a9405f430ed6)
- `playwright-automation`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 89c6896f566cbba7)
- `prisma-postgres-mastery`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: f685f84c7cb4567f)
- `project-context-map`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 72cbcbd10c2dfefe)
- `release-and-rollback`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 242c63502261b1ed)
- `review`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: c3b36f90db380661)
- `rust-native-backend`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 541b65384c7358e9)
- `secret-serialization`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 016233e861d7f2f8)
- `security-and-hardening`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: e614cc1d8ddccf00)
- `skill-creator`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 4f42bc21e86b3b44)
- `systematic-debugging`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 84d11ac683c41727)
- `task-memory-and-state`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: d649c4c781a0bd47)
- `test-driven-development`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 935aac0cc2598ca8)
- `turborepo`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 79c71066d40896c3)
- `ui-ux-pro-max`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: ae7e64a947d88a94)
- `vercel-react-best-practices`: [UNVERIFIED] (Структура OK: 3 кейсів, 10 тригерів, Хеш: 007534d50b50d661)

---

## 3. Корисні команди для керування статусом

- Перевірити статус: `pnpm skills:status`
- Прогнати тільки змінені або неперевірені: `pnpm skills:eval:changed`
- Прогнати конкретний скіл: `pnpm skills:eval --skill=backend`
- Прогнати всі скіли (сухий прогін): `pnpm skills:eval:dry`
- Прогнати маршрутизацію: `pnpm skills:eval:routing`

Оновлено автоматично через `scripts/ops/skills-status.mjs`.
