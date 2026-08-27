# 📚 SmartFeed Studio — Офіційна База Знань та Документація (WIKI)

Ласкаво просимо до центральної бази знань проекту **SmartFeed Studio**! Тут систематизовано всю інформацію про архітектуру, технологічний стек, схему бази даних, CQRS взаємодії, функціонал десктопного та веб-клієнтів, тестове покриття та посібники для користувачів і розробників.

---

## 🧭 Зміст WIKI (Table of Contents)

### 📌 [01. Огляд Проекту (Overview)](./01-overview/)

- [🎯 Місія, бачення продукту та цільова аудиторія](./01-overview/product-vision.md)
- [🏛 Високорівнева архітектура системи (Monorepo Architecture)](./01-overview/architecture-high-level.md)

### 🛠 [02. Технологічний Стек (Tech Stack)](./02-tech-stack/)

- [📊 Матриця технологій та інструментів за шарами](./02-tech-stack/stack-matrix.md)
- [🐳 Локальна інфраструктура Docker Compose (Postgres, Redis, MinIO)](./02-tech-stack/infrastructure-docker.md)

### 🗄 [03. Схема Бази Даних (Database Schema)](./03-database-schema/)

- [📋 Моделі Prisma ORM та структура таблиць](./03-database-schema/prisma-models.md)
- [🔗 Діаграма зв'язків сутностей (ERD) та каскадні правила](./03-database-schema/entity-relations.md)
- [⏱ Політика динамічної тривалості тарифів та блокування доступу](./03-database-schema/dynamic-durations-policy.md)

### ⚙️ [04. Архітектура Бекенду (NestJS CQRS)](./04-backend-cqrs/)

- [🔄 Принципи CQRS: CommandBus, QueryBus, EventBus](./04-backend-cqrs/cqrs-architecture.md)
- [🔐 Модуль авторизації, JWT токени та відновлення паролів](./04-backend-cqrs/auth-module.md)
- [💳 Модуль тарифів, ліцензій та RequireActiveLicenseGuard](./04-backend-cqrs/licenses-and-plans.md)
- [☁️ Storage модуль: пряме завантаження в S3 через Presigned URLs](./04-backend-cqrs/storage-s3.md)
- [🧭 Динамічна навігація та симулятор прав доступу](./04-backend-cqrs/navigation-module.md)

### 🖥 [05. Десктопний Клієнт (Desktop Client — Tauri v2)](./05-desktop-client/)

- [🦀 Архітектура Tauri v2, Rust Core, OS Keychain та SQLCipher](./05-desktop-client/tauri-architecture.md)
- [📱 Огляд екранів: Дашборд, Каталоги, AI, Хмара, Тарифи, Налаштування](./05-desktop-client/pages-and-features.md)
- [🌐 100% Інтернаціоналізація (UA ⇄ EN) та дизайн-система тем shadcn/ui](./05-desktop-client/i18n-and-theming.md)

### 🏢 [06. Панель Адміністратора (Admin Web Portal)](./06-admin-portal/)

- [🛡 Можливості Super Admin: керування користувачами, планами, ліцензіями](./06-admin-portal/admin-features.md)

### 🧪 [07. Тестування та Контроль Якості (QA & Testing)](./07-testing-and-qa/)

- [🔬 Стратегія тестування (TDD, Jest E2E, Playwright POM)](./07-testing-and-qa/testing-strategy.md)
- [📈 Матриця покриття автоматизованими тестами (106 тестів — 100% PASS)](./07-testing-and-qa/test-coverage-matrix.md)
- [🧹 Політика нульових залишків та ізоляції тестових даних (Zero Leftovers)](./07-testing-and-qa/teardown-policy.md)

### 💡 [08. Посібник Користувача та FAQ (User Guide & FAQ)](./08-user-faq/)

- [❓ Загальні часті запитання (FAQ) та вирішення типових ситуацій](./08-user-faq/user-guide-faq.md)
- [💳 FAQ щодо тарифних планів, пробного періоду та блокування функціоналу](./08-user-faq/plans-and-pricing-faq.md)

### 📋 [09. Плани Фіч та Дорожні Карти (Feature Plans & Roadmaps)](../plans/)

- [💎 Стратегія 4-рівневих тарифних планів та дорожня карта продукту](../plans/tariff_strategy.md)
- [Реєстр планів та регламент погодження](../plans/README.md)

---

> [!TIP]
> **Автоматичне оновлення WIKI:** База знань підтримується у синхронізованому стані з кодом. Будь-які зміни в базі даних, нові ендпоінти, UI екрани чи зміна бізнес-логіки автоматично фіксуються у відповідних розділах WIKI.
