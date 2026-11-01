# Нотатки та специфікація життєвого циклу Hooks (Antigravity Lifecycle Hooks Contract)

Результат спайк-дослідження AS-2.0 та верифікації документації Antigravity (`hooks.md`).

## 1. Точні назви інструментів для matcher

- Виконання команд: `run_command`
- Робота з файлами: `write_file`, `edit_file`, `read_file` (legacy-імена `write_to_file`, `replace_file_content` є недійсними і ніколи не спрацьовували)
- MCP-інструменти: `call_mcp_tool` або нативні префікси `mcp_.*`
- Matcher для PreToolUse guard: `run_command|write_file|edit_file|read_file|call_mcp_tool`

## 2. Семантика злиття та авто-схвалення (Auto-Approver vs Guard)

- Конфлікт між декількома хуками усувається шляхом консолідації в єдиний guard-модуль `pre-tool-guard.mjs`.
- Якщо інструмент є MCP (`call_mcp_tool` або `mcp_.*`), guard миттєво повертає `{"decision": "allow"}` згідно з правилом `CORE-08`.
- Для `run_command`, `write_file`, `edit_file`, `read_file` послідовно перевіряються детерміновані правила R1..R9.

## 3. Специфікація подій Stop та SessionStart

- `SessionStart`:
  - Вхід (stdin): `conversationId`, `workspacePaths`, `transcriptPath`, `artifactDirectoryPath`, `modelName`.
  - Вихід (stdout): `{"injectSteps": [{"ephemeralMessage": "..."}]}`.
  - Ліміт контексту: до 1500 токенів із нагадуванням про активну задачу, Invariant 20 (читання `plans/compact/`) та ключові правила.

- `Stop`:
  - Вхід (stdin): `executionNum`, `terminationReason` (`"NO_TOOL_CALL"`), `fullyIdle: true`.
  - Умова запуску: лише коли `executionNum <= 2` та `terminationReason === "NO_TOOL_CALL"`.
  - Дія: швидка перевірка змінених файлів (`git diff --name-only`). У разі виявлення CRITICAL-порушень (заборонені `as any`, порушення бюджету рядків >300, залишені `console.log`) повертає `{"decision": "continue", "reason": "..."}` для самовиправлення агента.

## 4. Контракт PostToolUse (Auto-Formatter)

- Matcher: `write_file|edit_file`
- Вхід: `toolCall.name`, `toolCall.args.Path`
- Дія: форматування зміненого файлу через Prettier (таймаут 15 с, без аварійного завершення).
