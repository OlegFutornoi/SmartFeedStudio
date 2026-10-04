---
name: mock-real-parity-testing
version: 1.0.0
description: 'Use when writing or modifying data services, repositories, or UI tests that run in local browser (mock/SQLite) or against real backend server: enforces 100% data and behavioral parity between environments so UI looks and behaves identically.'
---

# Mock vs Real Backend Parity Testing

Забезпечує 100% поведінковий та структурний паритет між локальним режимом (`mockDatabaseDriver` у браузері, SQLCipher у Tauri) та реальним сервером (`NestJS` + PostgreSQL).

## Загальні принципи

1. **Один бізнес-результат**: Будь-яка дія (створення товару, фільтрація, видалення фіда, підрахунок лічильників) повертає однакові дані в обох середовищах.
2. **Нуль колонок замість значень**: Заборонено повертати технічні заглушки (наприклад, слово "Постачальник" замість реальної назви "Brain" чи "MMM").
3. **Спільні тестові сценарії**: Параметризовані тести ганяють ті самі перевірки на мок-драйвері та на реальному API.
4. **Каскадна узгодженість**: Якщо видалення фіда видаляє товари на бекенді, локальний драйвер зобов'язаний виконати те саме каскадне видалення.

## Reference — індекс

| Тригер                                                                                | Reference                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Проєктування або правка `mockDatabaseDriver`, `LocalProductsService`, `api/client.ts` | [`parity-contract.md`](references/parity-contract.md)         |
| Написання Playwright/Jest тестів для перевірки обох середовищ (Mock ⇄ Real)           | [`test-suite-patterns.md`](references/test-suite-patterns.md) |
| Гідратація зв'язків (постачальники, категорії, активні фіди, лічильники)              | [`hydration-rules.md`](references/hydration-rules.md)         |

## Заборони

- Заборонено залишати різницю в полях: якщо на бекенді повертається `supplierName`, мок не має права повертати `supplier_id` без `supplierName`.
- Заборонено писати тести тільки для Mock режиму, ігноруючи поведінку при роботі з реальним сервером.
