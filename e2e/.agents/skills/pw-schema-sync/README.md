# API Schema & Contract Synchronizer (`pw-schema-sync`)

Інструмент та навичка для автоматизованої синхронізації бекенд-специфікацій (Swagger / OpenAPI / Nelmio), генерації валідаційних AJV Draft-07 JSON-схем та оновлення суворо типізованих TypeScript DTO моделей.

---

## 💬 1. Запуск через чат з ШІ-агентом (Природною мовою)

Синхронізацію схем можна запускати звичайними словами прямо в чаті — агент самостійно активує скіл `pw-schema-sync`, розпізнає продукт та стенд, завантажить специфікацію та згенерує типи.

### Приклади запитів у чаті:

- **Product Manager:**
  > _"Онови схеми для Product Manager на stage3"_
  > _"Синхронізуй схеми PM зі stage"_
- **IBPM (Insurance BPM):**
  > _"Синхронізуй схеми IBPM для review2"_
  > _"Підтягни свіжий Swagger для IBPM зі stage"_
- **OTP Service:**
  > _"Онови схеми для OTP сервісу на stage"_
- **AmoCRM / Leads:**
  > _"Онови контракти CRM на stage"_
- **Всі продукти одразу:**
  > _"Онови всі схеми проектів на stage"_
- **З явним зазначенням скіла:**
  > _"@pw-schema-sync онови схеми для pm на stage3"_

---

## 💻 2. Швидкий запуск через термінал (CLI Reference)

Якщо потрібно запустити синхронізацію самостійно в консолі без агента, використовуйте майстер-скрипт `tools/sync-schemas.cjs` з прапорцями `--product` та `--env`.

### Основні команди:

```bash
# Product Manager з оточення stage3 (з урахуванням extended=true та блоку МТСБУ)
node tools/sync-schemas.cjs --product=pm --env=stage3

# IBPM (Insurance BPM) з review2
node tools/sync-schemas.cjs --product=ibpm --env=review2

# OTP Service зі stage
node tools/sync-schemas.cjs --product=otp --env=stage

# AmoCRM / Leads зі stage
node tools/sync-schemas.cjs --product=crm --env=stage

# Синхронізація всіх підтримуваних продуктів на stage
node tools/sync-schemas.cjs --product=all --env=stage

# Швидкий запуск без фінального typecheck/lint
node tools/sync-schemas.cjs --product=pm --env=stage3 --skip-typecheck
```

### 2. Запуск через скрипт скіла (`.agents/skills/pw-schema-sync/scripts/sync-schemas.cjs`)

Скрипт скіла прозоро підтримує як новий синтаксис з прапорцями `--product` та `--env`, так і легасі-режим для IBPM:

```bash
# Мульти-продуктовий запуск через скіл
node .agents/skills/pw-schema-sync/scripts/sync-schemas.cjs --product=pm --env=stage3

# Легасі повний цикл для IBPM (завантаження свіжого Swagger + компіляція типів)
node .agents/skills/pw-schema-sync/scripts/sync-schemas.cjs --download
```

### 3. Окремі команди з package.json

```bash
# Генерація TypeScript інтерфейсів з наявних JSON-схем
npm run schemas:types

# Перевірка валідності схем через AJV валідатор
npm run schemas:validate
```

---

## 📋 Таблиця параметрів запуску

| Параметр           | Можливі значення                                                          | За замовчуванням | Опис                                                         |
| ------------------ | ------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------ |
| `--product`        | `pm`, `ibpm`, `otp`, `crm`, `all`                                         | `pm`             | Цільовий мікросервіс для оновлення контрактів                |
| `--env`            | `stage`, `stage3`, `integration`, `review1`, `review2`, `review3`, `prod` | `stage3`         | Цільове оточення для викачування специфікації                |
| `--skip-typecheck` | прапорець без значення                                                    | `false`          | Пропустити фінальний запуск `tsc --noEmit` та `npm run lint` |
| `--help`, `-h`     | -                                                                         | -                | Вивести довідку про всі опції                                |

---

## 🗺️ Матриця джерел контрактів за сервісами

| Продукт (`--product`)      | Джерело специфікації                                                                     | Підтримувані стенди                              | Куди зберігаються схеми        |
| -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------ |
| **`pm`** (Product Manager) | `https://product-manager-{env}.finance.ua/api/doc` + реальні ендпоінти (`extended=true`) | `stage3`, `integration`, `stage`, `prod`         | `api/schemas/product-manager/` |
| **`ibpm`** (Insurance BPM) | `https://insurance-bpm-api-{env}.treeumapp.net/admin/?routeName=app.swagger_ui`          | `stage`, `review1`, `review2`, `review3`, `prod` | `api/schemas/ibpm/`            |
| **`otp`** (OTP Service)    | `https://otp-service-{env}.treeumapp.net/swagger/v1/swagger.json`                        | `stage`, `review2`, `prod`                       | `api/schemas/otp/`             |
| **`crm`** (AmoCRM / Leads) | `https://amocrm-service-{env}.treeumapp.net/api-docs`                                    | `stage`, `review2`, `prod`                       | `api/schemas/crm/`             |

---

## ⚙️ Що робить скіл під капотом (5 фаз автоматичного пайплайну)

1. **Завантаження специфікації (`tools/download-spec.cjs`):**
   - Формує URL до Swagger/OpenAPI чи Nelmio на основі вибраного продукту та оточення.
   - Зберігає сирий контракт у локальний кеш: `tests/api/docs/{product}-{env}-spec.json`.
2. **Екстракція та адаптація до Draft-07:**
   - Транслює OpenAPI 3.0 типи `nullable: true` у Draft-07 сумісні `type: ["string", "null"]`.
   - Рекурсивно розгортає `$ref` посилання.
   - Підтримує як стандартні, так і розширені моделі відповідей (наприклад, `extended=true` для Product Manager з блоком `mtsbuStatistics`).
3. **AJV Валідація:**
   - Компілює схеми за допомогою `ajv` (Draft-07) з плагіном `ajv-formats`.
   - Виконує перевірку реальних прикладів відповідей стенду проти згенерованої схеми.
4. **Синхронізація TypeScript типів:**
   - Оновлює моделі у `api/{product}/models/` без використання небезпечних типів (`any`, `Record<string, unknown>`).
5. **Quality Gate:**
   - Автоматично запускає `npx tsc --noEmit` та `npm run lint` для запобігання регресіям у тестах.

---

## 📁 Структура пов'язаних файлів

```text
.agents/skills/pw-schema-sync/
├── SKILL.md                          # Інструкція для ШІ-агентів
├── README.md                         # Ця документація користувача
└── scripts/
    └── sync-schemas.cjs              # Вхідна точка скіла

tools/
├── sync-schemas.cjs                  # Майстер-скрипт оркестрації (Master CLI)
├── download-spec.cjs                 # Завантажувач специфікацій за продуктами та стендами
├── extract-schemas.cjs               # Конвертер OpenAPI 3.0 -> AJV Draft-07
└── generate-types-from-schemas.cjs   # Генератор TypeScript інтерфейсів

api/
├── schemas/                          # Згенеровані валідаційні схеми (Draft-07)
│   ├── product-manager/
│   ├── ibpm/
│   ├── otp/
│   └── crm/
└── {product}/models/                 # TypeScript DTO інтерфейси
```

---

## ❓ Часті запитання (FAQ)

### Чи потрібно передавати повне посилання на Swagger?

**Ні.** Всі стандартні ендпоінти для відомих сервісів (`pm`, `ibpm`, `otp`, `crm`) уже зашиті в `tools/download-spec.cjs`. Достатньо лише передати прапорці `--product` та `--env`.

### Що робити, якщо на стенді повертаються нові поля (наприклад, `avg_settlement_days`)?

Запустіть синхронізацію з відповідного стенду:

```bash
node tools/sync-schemas.cjs --product=pm --env=stage3
```

Інструмент автоматично підтягне свіжі поля в схему та оновить TypeScript типи.
