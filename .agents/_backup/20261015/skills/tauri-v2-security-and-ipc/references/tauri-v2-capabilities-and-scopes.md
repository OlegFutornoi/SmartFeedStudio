# Tauri v2 Capabilities & Permission Scoping Architecture

## 1. Архітектура Capabilities у Tauri v2

У Tauri v2 замість глобального прапора `allowlist` діє модульна система безпеки на основі файлів Capabilities (розташованих у `apps/desktop/src-tauri/capabilities/`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Обмежені дозволи для головного вікна додатку SmartFeed Studio",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:path:default",
    "core:event:default",
    {
      "identifier": "fs:allow-read",
      "allow": [{ "path": "$APPDATA/feeds/**" }, { "path": "$DOWNLOAD/**" }]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [{ "path": "$APPDATA/feeds/**" }]
    }
  ]
}
```

## 2. Захист від виклику IPC сторонніми доменами

Якщо застосунок відображає зовнішні веб-сторінки або рендерить HTML із описів товарів:

- **Заборонено**: Включати зовнішній URL у список `windows` з повними правами.
- **Обов'язково**: Конфігурувати `tauri.conf.json` з суворою політикою CSP (Content Security Policy):

```json
"app": {
  "security": {
    "csp": "default-src 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' http://localhost:4000 https://api.smartfeed.studio;"
  }
}
```

## 3. Чеклист безпеки capabilities перед релізом

- [ ] Відсутній дозвіл `fs:allow-all` або `fs:scope` з доступом до кореня диска `/` або `C:\`.
- [ ] Дозволи файлової системи строго обмежені `$APPDATA` та папкою вибраного фіду.
- [ ] Дозволи плагіна діалогів (`dialog:default`) активні лише для явних вікон вибору файлів.
- [ ] Перевірено відсутність небезпечного прапора `dangerousRemoteUrlValidation`.
