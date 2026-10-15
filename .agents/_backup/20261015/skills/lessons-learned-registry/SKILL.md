---
name: lessons-learned-registry
version: 1.0.0
description: 'Use before starting any task and after any bug/user correction: reads the registry of already-fixed error classes (invariants) and appends new ones, so agents never repeat a mistake and self-evolve.'
---

# Lessons Learned Registry

Пам'ять агентів про вже виправлені класи помилок. Джерело істини: [`registry.md`](references/registry.md).

## Загальні принципи

1. **Читати перед задачею**: `grep -i` у `registry.md` за ключовими словами задачі (сутність, шар, тип операції) — не читати файл цілком, якщо він великий.
2. **Писати після виправлення**: кожен баг, який користувач помітив раніше за агента, або будь-яка повторна помилка = новий запис.
3. **Запис = інваріант + захист**: лише перевірюване правило і спосіб його автоматичної перевірки (тест/lint), без історій.
4. **Без дублів**: перед записом `grep` по реєстру та `.agents/rules/`.

## Reference — індекс

| Тригер                                                     | Reference                                             |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| Старт будь-якої задачі; перед проєктуванням; перед рев'ю   | [`registry.md`](references/registry.md)               |
| Знайдено баг / користувач виправив агента / помилка вдруге | [`record-template.md`](references/record-template.md) |

## Заборони

- Не додавати запис без способу перевірки (тест, lint-правило або пункт чеклиста).
- Не перевищувати 250 рядків у `registry.md`: при росту розбити на `registry-backend.md`, `registry-frontend.md`, `registry-testing.md`.
