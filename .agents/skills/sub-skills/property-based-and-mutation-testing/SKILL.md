---
name: property-based-and-mutation-testing
version: 1.0.0
description: 'Use when writing or testing XML/CSV parsers, feed transformers, data validators, or calculation algorithms: runs property-based tests with fast-check (fuzzing edge cases) and mutation testing with Stryker to ensure tests actually detect bugs and cannot be tricked by trivial mocks.'
---

# Property-Based & Mutation Testing

Гарантує, що автотести дійсно перевіряють бізнес-логіку та знаходять дефекти, а не є формальними зеленими «smoke-заглушками».

## Загальні принципи

1. **Property-Based тестування (`fast-check`)**: Замість 2–3 захардкодzone-прикладів парсери XML/CSV та нормалізатори цін перевіряються на сотнях випадкових згенерованих вхідних даних (fuzzing: порожні рядки, CDATA, битий UTF-8, від'ємні ціни, гігантські числа).
2. **Мутаційне тестування (Stryker)**: Мутатор змінює оператори в коді (наприклад, `>` на `>=`, видаляє виклик функції, повертає `[]`). Тести **зобов'язані впасти** і вбити мутанта. Якщо код змінено, а тести все одно зелені — тест вважається дефектним.
3. **Захист від оманливих моків**: Тести, які перевіряють поведінку мока замість справжньої логіки парсингу чи валідації, суворо заборонені.

## Reference — індекс

| Тригер                                                           | Reference                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Написання генераторів випадкових даних для фідів, цін, категорій | [`fast-check-patterns.md`](references/fast-check-patterns.md)           |
| Запуск мутаційного аналізу та інтерпретація Mutation Score       | [`mutation-testing-guide.md`](references/mutation-testing-guide.md)     |
| Крайові випадки та фаззінг парсерів фідів (XML/CSV/Websklad)     | [`parser-fuzzing-checklist.md`](references/parser-fuzzing-checklist.md) |

## Заборони

- Заборонено писати тести парсерів лише на 1 валідному файлі без перевірки битих структур.
- Заборонено вважати сьют надійним, якщо при зміні умови в бізнес-коді тести залишаються зеленими.
