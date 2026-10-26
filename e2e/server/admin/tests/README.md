# UI-тести Admin Portal (`e2e/server/admin/tests/`)

Ця директорія містить Playwright UI-тести для Admin Portal (`http://localhost:3001`), які перевіряють клієнтський захист інтерфейсу, навігацію та ізоляцію адмін-панелі.

---

## Команди запуску

### Запуск усіх UI-тестів адмінки

```bash
pnpm --filter @smartfeed/e2e test:server:admin
```

_або через Playwright CLI:_

```bash
npx playwright test server/admin --project=server-admin
```

### Запуск з візуальним відображенням браузера (Headed mode)

```bash
npx playwright test server/admin --project=server-admin --headed
```

### Відкриття останнього HTML-звіту

```bash
pnpm exec playwright show-report reports/html
```

---

## Структура підкаталогів

| Каталог                                                                            | Опис модуля                                                                                       | Документація                                                                                       |
| :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------- |
| [`access/`](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/admin/tests/access/) | Тести захисту маршрутів (`AuthGuard`), перевірки прав доступу за ролями та редиректів на `/login` | [access/README.md](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/admin/tests/access/README.md) |
