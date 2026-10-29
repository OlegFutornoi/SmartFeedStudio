# BE-02: Інтеграція OmniRoute AI Gateway для масового збагачення товарних каталогів

## 1. Мета та контекст

Впровадити інтелектуальний шлюз маршрутизації штучного інтелекту **OmniRoute** (`cheaper-inference/OmniRoute`) в інфраструктуру SmartFeed Studio для:

1. Зниження собівартості токенів при збагаченні великих товарних каталогів (100k+ SKU) через каскад моделей (Smart Combos: DeepSeek V3 / Gemini 1.5 Flash / GPT-4o-mini).
2. Забезпечення автоматичного перемикання при вичерпанні лімітів (429 Rate Limits / Quotas failover) у фонових воркерах BullMQ.
3. Надання єдиного відмовостійкого інтерфейсу AI-генерації через OpenAI-сумісний ендпоінт.

## 2. Архітектурні зміни та компоненти

- **Інфраструктура**: додавання сервісу `omniroute` у `docker-compose.yml` (порт 20128, образ `diegosouzapw/omniroute:latest`, том `omniroute_data`).
- **Спільні контракти (`@smartfeed/shared`)**:
  - DTO та моделі для класифікації категорій, генерації описів та витягу характеристик (`packages/shared/src/dtos/ai-gateway.dto.ts`).
  - Моделі перевірки стану та здоров'я AI-шлюзу (`AiGatewayHealthDto`).
- **Бекенд-сервіс (`services/backend-api/src/modules/ai/llm-gateway.service.ts`)**:
  - Інтеграція з OpenAI-сумісним API (`/v1/chat/completions`).
  - Підтримка резервного failover у разі недоступності шлюзу.
  - Методи: `classifyCategory`, `enrichProductAttributes`, `generateProductDescription`, `checkHealth`.
- **Конфігурація середовища**: оновлення `.env.example` параметрами `OMNIROUTE_BASE_URL` та `OMNIROUTE_API_KEY`.
- **Керування**: додано npm-скрипти `omniroute:up` та `omniroute:cli` в `package.json`.

## 3. Покроковий план реалізації

1. [x] Проєктування задачі та реєстрація в `plans/active/BE-02-omniroute-ai-gateway-integration.md`.
2. [x] Оновлення `docker-compose.yml` із сервісом `omniroute`.
3. [x] Створення контрактів у `packages/shared/src/dtos/ai-gateway.dto.ts` та експорт у `packages/shared/src/index.ts`.
4. [x] Збірка `@smartfeed/shared` (`pnpm --filter @smartfeed/shared build`).
5. [x] Створення `LlmGatewayService` у `services/backend-api/src/modules/ai/llm-gateway.service.ts` із підтримкою суворого JSON та failover.
6. [x] Реєстрація `LlmGatewayService` у `services/backend-api/src/modules/ai/ai.module.ts`.
7. [x] Оновлення `.env.example` ключами `OMNIROUTE_BASE_URL` та `OMNIROUTE_API_KEY`.
8. [x] Додавання команди в `package.json` для зручного керування шлюзом (`omniroute:up`, `omniroute:cli`).
9. [x] Повна перевірка якості та інваріантів: `pnpm invariants:check`, `pnpm i18n:check`, `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.
10. [x] Збірка бекенду `pnpm --filter @smartfeed/backend-api build`.
11. [x] Перенесення задачі у `plans/completed/` та фіксація стану в `.agents/state/active_task.json`.

## 4. Definition of Done (DoD)

- [x] Сервіс `omniroute` сконфігуровано в `docker-compose.yml`.
- [x] Контракти в `@smartfeed/shared` типізовані без використання `any`.
- [x] `LlmGatewayService` реалізовано з логуванням, обробкою помилок та direct fallback.
- [x] `pnpm invariants:check` повертає 0 нових порушень.
- [x] `pnpm i18n:check` проходить 100%.
- [x] `pnpm --filter @smartfeed/backend-api build` компілюється без помилок.
