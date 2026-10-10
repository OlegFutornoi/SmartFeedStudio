---
name: project-context-map
version: 1.0.0
description: 'Use at the start of any task to locate code without scanning the repo: compact map of SmartFeed Studio modules, entry points, data flow and where each domain lives. Update after any architectural change.'
---

# Project Context Map

Стисла карта проєкту, щоб не витрачати токени на сканування. Деталі — у `wiki/`.

## Загальні принципи

1. **Карта → wiki → grep → діапазон рядків**. Не відкривати файли «щоб подивитись».
2. **Карта оновлюється** у тій самій задачі, що змінила архітектуру (модуль, ендпоінт, таблиця, Tauri-команда, порт).
3. Якщо карта розходиться з кодом — виправити карту (код — істина) і записати в `lessons-learned-registry`.

## Reference — індекс

| Тригер                                           | Reference                                             |
| ------------------------------------------------ | ----------------------------------------------------- |
| Потрібно знайти, де живе домен/файл; нова задача | [`map.md`](references/map.md)                         |
| Змінено архітектуру, модулі, схему, ендпоінти    | [`update-protocol.md`](references/update-protocol.md) |
