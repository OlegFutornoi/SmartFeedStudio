# 📋 Задача QA-BE-02: Архітектура та реалізація модуля структурованого логування тестів (`TestLogger` / `ApiLogger`)

> **Префікс / ID:** `qa-be-02`  
> **Статус:** 🟢 Виконано (Completed) — 25.10.2026  
> **Відповідальний агент:** `@agents_planner` (проектування) / `@agents_qa` (реалізація)  
> **Напрямок:** `Core Architecture / Infrastructure` (`e2e/core/utils/test-logger.ts`)  
> **Цільове середовище:** Playwright Test Runner (Server Backend & Admin Portal)

---

## 1. Мета та архітектурний контекст

Забезпечити високоінформативне, лаконічне («коротке, але зрозуміле») та безпечне логування виконання API та UI тестів у консолі та Playwright-звітах без захаращення терміналу зайвими JSON-дампами.

### Проблема:

- Стандартний `console.log` або друк повних об'єктів створює нечитабельний шум у звітах (дампи токенів, паролів, довгі списки користувачів).
- Відсутність єдиного формату логування не дозволяє швидко зрозуміти таймінги запитів, статус-коди та результат рантайм-валідації Zod-схем.
- Вимога `pw-api` (розділ 8) прямо забороняє хаотичний `console.log` і вимагає типізованого API логера.

### Рішення:

Створити модуль `TestLogger` (з сумісним псевдонімом `ApiLogger`), який:

1. Друкує рівно **1 компактний рядок** на подію з візуальними бейджами (`➔ REQ`, `✔ RES`, `⚠ WARN`, `⛔ BLOCKED`, `🔍 SCHEMA`).
2. Фіксує час виконання кожного HTTP-запиту в мілісекундах (`ms`).
3. Автоматично **маскує конфіденційні дані** (Bearer-токени, паролі, секрети, cookies).
4. Інтегрується з `ApiClient` та `response.assertions.ts` для прозорої автоматичної фіксації 4-рівневого захисту.

---

## 2. Специфікація інтерфейсу `TestLogger`

```typescript
export interface LoggerOptions {
  enabled?: boolean;
  maskSecrets?: boolean;
}

export class TestLogger {
  // Фіксація назви та ідентифікатора тесту
  static test(id: string, name: string): void;

  // Логування кроку тесту
  static step(current: number, total: number, description: string): void;

  // Логування відправки HTTP-запиту (1 рядок)
  static request(method: string, endpoint: string, summary?: string): void;

  // Логування отриманої відповіді із часом виконання
  static response(status: number, durationMs: number, summary?: string): void;

  // Логування успішної валідації рантайм-контракту Zod
  static schema(schemaName: string, isValid: boolean, errorDetails?: string): void;

  // Логування перевірки рівня захисту
  static assertion(layer: string, description: string): void;

  // Загальний успіх / попередження / помилка
  static success(message: string): void;
  static warn(message: string): void;
  static failure(message: string, error?: unknown): void;
}
```

---

## 3. Поетапний план реалізації

- [x] **Етап 1:** Створення модуля логування `e2e/core/utils/test-logger.ts` із ANSI-стилізацією та санітизацією чутливих даних.
- [x] **Етап 2:** Інтеграція `TestLogger` у базовий клієнт `e2e/core/http/api-client.ts` для автоматичного вимірювання часу та фіксації викликів.
- [x] **Етап 3:** Інтеграція `TestLogger` у 4-рівневі перевірки `e2e/core/assertions/response.assertions.ts` для підтвердження статусу, заголовків `nosniff` та Zod-схем.
- [x] **Етап 4:** Перевірка компіляції (`pnpm --filter @smartfeed/e2e typecheck`) та візуального виводу при прогоні `pnpm test:server:backend`.
- [x] **Етап 5:** Фіксація задачі як виконаної, оновлення реєстру `e2e/tasks/README.md`.

---

## 4. Критерії готовності (DoD)

1. [x] Модуль експортує `TestLogger` та `ApiLogger` із методами згідно з `pw-api`.
2. [x] Вивід у терміналі компактний (1 рядок на запит/відповідь), містить HTTP-метод, URL, статус, тривалість у `ms` та назву перевіреної схеми.
3. [x] Чутливі поля (`password`, `accessToken`, `refreshToken`, `Authorization`) автоматично маскуються (`***`).
4. [x] Жодних помилок типізації (`tsc --noEmit`).
5. [x] Усі 14 тестів `pnpm test:server` успішно проходять із новим модулем логування (14 passed, 100%).
