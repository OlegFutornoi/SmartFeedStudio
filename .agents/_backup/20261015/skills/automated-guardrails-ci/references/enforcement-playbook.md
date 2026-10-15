# Enforcement Playbook

1. Сформулювати правило як перевірюване твердження.
2. Обрати механізм: ESLint → тест → hook (`.agents/hooks.json`) → CI-скрипт.
3. Додати як `warn`, порахувати порушення: `pnpm lint 2>&1 | grep -c <rule>`.
4. Виправити наявні порушення (окремою задачею/планом), тоді `error`.
5. Перевірити на штучному порушенні, що правило спрацьовує.
6. Записати в `guardrails-catalog.md` та `lessons-learned-registry`.
7. `pnpm lint:fix && pnpm format`.
