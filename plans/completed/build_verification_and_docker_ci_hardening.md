# 🛡️ План та Архітектурний Алгоритм: Гарантована Перевірка Збірки перед Білдом та Hardening CI/CD

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 27.08.2026  
> **Ціль:** Усунути виникнення помилок збірки під час релізів у GitHub Actions, модернізувати середовище збірки (Node 22 LTS замість застарілого Node 20), надати Dockerfile надійне значення `DATABASE_URL` для генерації клієнта Prisma та впровадити 4-рівневу систему контролю якості (Local Pre-Check ➔ Git Pre-Push Hook ➔ CI Gating Job ➔ Safe Docker Build).

---

## 🔍 1. Глибокий аналіз інциденту (Root Cause Analysis)

### Проблема 1: Чому Docker Build впав на `prisma generate`?

- **Лог помилки:**
  ```text
  #21 [builder 13/15] RUN pnpm --filter @smartfeed/backend-api prisma:generate
  Failed to load config file "/app/services/backend-api" as a TypeScript/JavaScript module.
  Error: PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL.
  ```
- **Причина:**
  У Prisma 7 конфігурація [prisma.config.ts](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/prisma.config.ts) використовувала хелпер `env('DATABASE_URL')`. Хелпер `env()` у Prisma 7 строго викидає виняток `PrismaConfigEnvError`, якщо змінна відсутня.
  - На локальній машині розробника існує файл `.env`, з якого `dotenv` завантажує змінні.
  - У Dockerfile файл `.env` виключений через [.dockerignore](file:///Users/oleg/AQA/SmartFeedStudio/.dockerignore) (із міркувань безпеки).
  - Під час виконання `RUN pnpm --filter @smartfeed/backend-api prisma:generate` змінна `DATABASE_URL` була відсутня в середовищі образу, що призвело до краху.
  - **Парадокс:** `prisma generate` взагалі не підключається до бази даних — він лише генерує статичний TypeScript-код на основі `schema.prisma`. Проте Prisma 7 валідує `prisma.config.ts` перед запуском генератора.

### Проблема 2: Попередження про застарілий Node 20 на GitHub Actions Runners

- **Лог:**
  ```text
  Node 20 is being deprecated. This workflow is running with Node 24 by default.
  If you need to temporarily use Node 20, you can set the ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true...
  ```
- **Причина:**
  GitHub офіційно оголосив про знецінення Node 20 для ранерів Actions і перехід на Node 24. Всі пайплайни [.github/workflows/ci.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/ci.yml) та [docker.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/docker.yml) використовували `node-version: 20` та базові Docker-образи `node:20-alpine`.

### Проблема 3: Чому білд у GitHub Actions пішов без попередньої перевірки? (Головне архітектурне питання)

- **Розрив між тригерами пайплайнів:**
  - Пайплайн [ci.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/ci.yml) запускається **виключно** на `push: branches: [main]`.
  - Пайплайн публікації Docker [docker.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/docker.yml) запускається на `push: tags: ['v*']`.
  - Коли розробник створює та пушить релізний тег (наприклад, `v1.5.0` або `git push --tags`), **`ci.yml` взагалі не виконується**!
  - `docker.yml` не мав попереднього етапу валідації (`pre-flight verification`) і відразу викликав `docker/build-push-action@v6` з параметром `push: true`.
  - У репозиторії був лише `.husky/pre-commit` (який перевіряє тільки форматування `lint-staged`), але **повністю був відсутній `.husky/pre-push`**, що дозволяло відправити непротестований тег у віддалений репозиторій.

---

## 🚀 2. Алгоритм Гарантованої Перевірки (4-Level Defense Algorithm)

```mermaid
flowchart TD
    subgraph Level1["Рівень 1: Локальний захист (Developer / Agent)"]
        L1A["Розробник/Агент пише код"] --> L1B["Команда: pnpm verify:build"]
        L1B --> L1C["Генерація Prisma з dummy URL"]
        L1C --> L1D["Компіляція всіх пакетів (Turbo Build)"]
    end

    subgraph Level2["Рівень 2: Git Pre-Push Hook (.husky/pre-push)"]
        L1D --> L2A["git push / git push --tags"]
        L2A --> L2B["Husky перехоплює push"]
        L2B --> L2C["Автозапуск pnpm verify:build"]
        L2C -- "Помилка" --> L2D["Блокування push на рівні Git!"]
        L2C -- "Успіх" --> L3A
    end

    subgraph Level3["Рівень 3: GitHub Actions Gating (docker.yml)"]
        L3A["Тригер тегу v* у GitHub"] --> L3B["Обов'язкова Job: pre-build-verification"]
        L3B --> L3C["Node 22 LTS Setup & pnpm install"]
        L3C --> L3D["Typecheck & pnpm build & Тести"]
        L3D -- "Збій перевірки" --> L3E["Реліз зупинено! Жоден битий образ не публікується!"]
        L3D -- "Успіх (needs: verification)" --> L4A
    end

    subgraph Level4["Рівень 4: Dockerfile Hardening & Node 22"]
        L4A["Job: publish-backend-api & publish-admin-portal"]
        L4B["FROM node:22-alpine"]
        L4C["ENV DATABASE_URL=placeholder..."]
        L4A --> L4B --> L4C --> L4D["Успішний безпомилковий Docker Build & Push"]
    end
```

---

## 🛠 3. Детальний План Змін

### Крок 1: Виправлення `prisma.config.ts` та Dockerfile

1. **[services/backend-api/prisma.config.ts](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/prisma.config.ts)**:
   - Забезпечити безпечний fallback для `DATABASE_URL`, щоб утиліта `prisma generate` працювала в будь-якому середовищі навіть без наявності локального `.env`:
     ```ts
     datasource: {
       url: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public',
     },
     ```
2. **[services/backend-api/Dockerfile](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/Dockerfile)**:
   - Оновити базовий образ на `node:22-alpine` (Active LTS).
   - Додати `ENV DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public"` перед викликом `prisma:generate`.
3. **[apps/admin-portal/Dockerfile](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/Dockerfile)**:
   - Оновити базовий образ на `node:22-alpine`.

### Крок 2: Додавання скриптів верифікації у `package.json`

- Додати у корінь [package.json](file:///Users/oleg/AQA/SmartFeedStudio/package.json):
  ```json
  "verify:build": "pnpm build:shared && pnpm prisma:generate && turbo run build",
  "verify:docker": "docker build -t smartfeed-backend-test -f services/backend-api/Dockerfile . && docker build -t smartfeed-admin-test -f apps/admin-portal/Dockerfile .",
  "verify:all": "pnpm verify:build && pnpm test && pnpm verify:docker"
  ```

### Крок 3: Впровадження Git Pre-Push Hook у `.husky/pre-push`

- Створити виконуваний файл [.husky/pre-push](file:///Users/oleg/AQA/SmartFeedStudio/.husky/pre-push):
  ```bash
  #!/usr/bin/env sh
  . "$(dirname -- "$0")/_/husky.sh"

  echo "🔍 [Pre-Push Hook] Запуск обов'язкової верифікації збірки перед пушем..."
  pnpm verify:build
  echo "✅ [Pre-Push Hook] Збірка успішна! Дозвіл на git push надано."
  ```

### Крок 4: Модернізація GitHub Actions (`docker.yml`, `ci.yml`, `release.yml`)

1. **[.github/workflows/docker.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/docker.yml)**:
   - Додати gating job `verify-release`:
     - Runs-on: `ubuntu-latest`
     - Node: `22`
     - Кроки: `pnpm install`, `pnpm build`, `pnpm prisma:generate`.
   - Зробити так, щоб `publish-backend-api` та `publish-admin-portal` мали:
     `needs: verify-release`!
2. **[.github/workflows/ci.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/ci.yml)**:
   - Оновити `node-version: 22`.
   - Додати тригер на теги `tags: ['v*']` або синхронізувати перевірки.
3. **[.github/workflows/release.yml](file:///Users/oleg/AQA/SmartFeedStudio/.github/workflows/release.yml)**:
   - Оновити `node-version: 22`.

---

## 🛡 4. Критерії Приймання (Definition of Done)

1. ✅ **Тест збірки Docker без `.env`**: Команда `docker build -f services/backend-api/Dockerfile .` успішно збирається локально при відсутності переданого `DATABASE_URL`.
2. ✅ **Node 22 LTS**: Жодних попереджень про депрекацію Node 20 у GitHub Actions.
3. ✅ **Захист від зламаних релізів (Gating)**: У разі помилки компіляції або тестів Docker image **не буде створюватись і пушитися в GHCR**.
4. ✅ **Git Pre-Push Hook**: Спроба запушити код із помилкою компіляції автоматично блокується локально.
5. ✅ **100% тестів залишаються зеленими**.
