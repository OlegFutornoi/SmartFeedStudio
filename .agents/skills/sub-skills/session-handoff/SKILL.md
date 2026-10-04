---
name: session-handoff
version: 1.0.0
description: 'Use when context is getting long, before compaction, when the user ends a session, or when resuming work: compacts the current task into plans/active/<task>.state.md so a fresh agent continues without re-reading the repo. Adapted from mattpocock/skills handoff.'
---

# Session Handoff

Стискає поточну роботу у файл стану, щоб наступна сесія (або інший агент) продовжила без повторного дослідження. Основа — [`mattpocock/skills/handoff`](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff), адаптовано: зберігання **у репозиторії** (`plans/active/`), а не в tmp ОС, бо tmp губиться між сесіями.

## Загальні принципи

1. **Один файл на задачу**: `plans/active/<feature_name>.state.md` поруч із планом `<feature_name>.md`.
2. **Писати факти, не історію**: що зроблено, що в процесі, що відкрито, рішення, команди перевірки.
3. **Відновлення починається зі state-файлу**: якщо він існує — читати його ДО будь-якого пошуку по коду.
4. **Оновлювати**, а не дописувати лог: старі пункти «в процесі» переносити у «зроблено».
5. При переносі плану в `plans/completed/` — state-файл видаляється (знання переходять у план, wiki та `lessons-learned-registry`).

## Reference — індекс

| Тригер                                                                                                    | Reference                                             |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Довга сесія, наближення компакції, користувач закінчує роботу, «збережи контекст», передача іншому агенту | [`state-template.md`](references/state-template.md)   |
| Початок сесії / резюме після компакції / «продовжуй»                                                      | [`resume-protocol.md`](references/resume-protocol.md) |

## Заборони

- Не зберігати handoff у tmp, Desktop чи `.gemini`.
- Не копіювати в state-файл код чи довгі логи — лише шляхи і висновки.
- Не записувати секрети, токени, паролі.
