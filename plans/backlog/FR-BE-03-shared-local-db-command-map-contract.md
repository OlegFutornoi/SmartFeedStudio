# 📋 Задача FR-BE-03: Винесення типізованої карти команд LocalDbCommandMap у `@smartfeed/shared`

> **Тип:** Спільна Full-Stack задача (`FR-BE`)  
> **Статус:** 📋 Беклог (Backlog)  
> **Пріоритет:** 🥇 Високий (необхідно для строгої типізації e2e-клієнта local-db)  
> **Відповідальні агенти:** `@agents_backend`, `@agents_frontend`

---

## 1. Ціль задачі

Перенести визначення `LocalDbCommandMap`, аргументів та результатів локальних SQLite-команд із `apps/desktop/src/services/local-db/types.ts` до пакету `@smartfeed/shared`.

## 2. Обґрунтування

Зараз `LocalDbCommandMap` знаходиться у воркспейсі `apps/desktop`. Для того щоб тестовий пакет `e2e/local/backend` мав доступ до суворої типізації команд `invoke(command, args)` без дублювання типів чи крос-пакетних відносних імпортів, контракт повинен знаходитись у єдиному джерелі істини — `@smartfeed/shared`.

## 3. Кроки реалізації

1. Винести інтерфейси команд із `apps/desktop/src/services/local-db/types.ts` у `packages/shared/src/local-db/commands.ts`.
2. Експортувати їх у `packages/shared/src/index.ts`.
3. Виконати `pnpm --filter @smartfeed/shared build`.
4. Оновити імпорти в `apps/desktop/src/services/local-db/client.ts` та `types.ts`.
5. Підключити строгу типізацію в `e2e/local/backend/clients/local-db.client.ts`.
6. Перевірити `pnpm verify:fast`.
