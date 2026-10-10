---
name: contract-first-api
version: 1.0.0
description: 'Use when creating, modifying, or integrating any API endpoint, DTO, or client-server interaction: defines Zod schemas and TypeScript types in packages/shared FIRST, ensuring client and server contracts never drift and eliminating inline ad-hoc types.'
---

# Contract-First API & Shared Type Safety

Гарантує, що клієнтські додатки (`apps/desktop`, `apps/admin-portal`) та серверний бекенд (`services/backend-api`) працюють через єдине джерело істини в `packages/shared`, унеможливлюючи розрив типів.

## Загальні принципи

1. **Контракт передує коду (Shared First)**: Будь-який новий ендпоінт, параметр або фільтр спочатку описується у `packages/shared` як Zod-схема та TypeScript DTO.
2. **Єдиний тип запиту/відповіді**: Заборонено дублювати інтерфейси на фронтенді чи бекенді. Обидві сторони імпортують типи з `@smartfeed/shared`.
3. **Повна заборона `as any` та `any`**: Будь-яка невідома структура валідується через Zod `.parse()` або `.safeParse()`.
4. **Синхронізація з OpenAPI/Swagger**: DTO контролерів NestJS відображають схеми Zod, забезпечуючи точну документацію в `/api/docs`.

## Reference — індекс

| Тригер                                                                 | Reference                                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Створення або модифікація Zod-схем та спільних DTO у `packages/shared` | [`zod-shared-patterns.md`](references/zod-shared-patterns.md)           |
| Інтеграція контрактів у NestJS контролери та клієнтські API сервіси    | [`client-server-codegen.md`](references/client-server-codegen.md)       |
| Перевірка на злам зворотної сумісності (Breaking Changes) контрактів   | [`breaking-change-detector.md`](references/breaking-change-detector.md) |

## Заборони

- Заборонено створення локальних інтерфейсів у компонентах для даних, які приходять з API.
- Заборонено мутувати схему API без запуску `pnpm --filter @smartfeed/shared build`.
