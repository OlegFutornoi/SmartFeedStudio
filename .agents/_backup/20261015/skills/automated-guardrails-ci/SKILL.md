---
name: automated-guardrails-ci
version: 1.0.0
description: 'Use when a rule keeps being violated or a new invariant is codified: converts text rules into automatic enforcement (ESLint rules, tests, hooks, CI) so violations are blocked, not just discouraged.'
---

# Automated Guardrails

Правило, яке можна перевірити машиною, **не живе лише в тексті**.

## Загальні принципи

1. Новий інваріант → одразу механізм блокування (lint/тест/hook), інакше запис у реєстрі неповний.
2. Спершу `warn` + підрахунок наявних порушень; перехід на `error` — після виправлення старих.
3. Перевіряти, що правило реально ловить порушення (тимчасовий приклад → має падати).

## Reference — індекс

| Тригер                                                                    | Reference                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Порушено імпорти `../`, `as any`, God-file, hex-кольори, порожній `catch` | [`guardrails-catalog.md`](references/guardrails-catalog.md)     |
| Додаєш нове правило в ESLint/hooks/CI                                     | [`enforcement-playbook.md`](references/enforcement-playbook.md) |
