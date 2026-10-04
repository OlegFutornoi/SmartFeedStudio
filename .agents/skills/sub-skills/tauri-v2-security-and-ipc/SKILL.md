---
name: tauri-v2-security-and-ipc
version: 1.0.0
description: 'Use for Tauri v2 native desktop security: capabilities and permission scoping, secure IPC commands, SQLCipher key derivation via OS Keychain, and safe filesystem operations.'
metadata:
  requires:
    packages: ['@tauri-apps/api', 'keyring-rs', 'rusqlite', 'tauri-plugin-sql']
---

# tauri-v2-security-and-ipc

Інженерний стандарт безпеки десктопного клієнта SmartFeed Studio (Tauri v2 + Rust + React): конфігурація capabilities, безпечний IPC міст, апаратне шифрування SQLCipher та зберігання ключів у системному Keychain.

## Залізні принципи безпеки десктопу

1. **Мінімальні привілеї Capabilities (Least Privilege)**: Заборонено видавати дикі дозволи (`"core:default"` на все вікно). Кожна команда Rust повинна бути явно описана в файлах можливостей `src-tauri/capabilities/*.json` з обмеженим доступом до конкретних вікон та URL.
2. **Апаратне зберігання ключів (OS Keychain Only)**: Майстер-ключ розшифрування локальної бази SQLCipher та JWT refresh-токени **категорично заборонено** зберігати у відкритому вигляді (в `localStorage`, конфігураційних `.json` чи SQLite). Вони зберігаються виключно в нативному Keychain операційної системи (macOS Keychain, Windows Credential Manager, Linux Secret Service) через Rust-крейт `keyring`.
3. **Захист від Command & Path Traversal Injection (CWE-22, CWE-78)**: Будь-які шляхи до файлів імпорту або експорту, передані з React у Tauri IPC, зобов'язані перевірятися в Rust через `dunce::canonicalize()` з контролем виходу за межі дозволеної робочої директорії. Заборонено виклики системної консолі `std::process::Command` з конкатенацією рядків.
4. **Сувора типізація IPC (Serde Validation)**: Усі аргументи функцій `#[tauri::command]` типізуються суворими структурами Rust (`Deserialize`), а не сирими рядками або `serde_json::Value`.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                   | Цільовий reference-файл                                                                            | Ключовий фокус                                                                      |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| Налаштування дозволів вікон, прав IPC у Tauri v2   | [`references/tauri-v2-capabilities-and-scopes.md`](references/tauri-v2-capabilities-and-scopes.md) | JSON capabilities, permissions, ізоляція від сторонніх URL, scopes файлової системи |
| Шифрування локальної БД SQLCipher, OS Keychain     | [`references/sqlcipher-key-management.md`](references/sqlcipher-key-management.md)                 | Робота з `keyring-rs`, генерація PBKDF2 солі, `PRAGMA key`, безпечний рестарт       |
| Безпека команд Rust `#[tauri::command]`, валідація | [`references/ipc-input-validation-rust.md`](references/ipc-input-validation-rust.md)               | Захист від Path Traversal (`dunce::canonicalize`), безпечні помилки для UI          |

## Категорично заборонено

- Зберігати refresh-токени чи паролі в `localStorage` вебв'ю десктопу (це вразливо до XSS).
- Використовувати `shell:open` або `process::Command` з несанітизованими аргументами.
- Залишати базу даних SQLCipher відкритою без `PRAGMA key` або з хардкодним статичним паролем.
- Дозволяти доступ до довільних локальних файлів без обмеження через Tauri FS Scope.
