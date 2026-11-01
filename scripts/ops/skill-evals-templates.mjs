/**
 * skill-evals-templates.mjs
 * Reference mappings and tailored evals for SmartFeed Studio core skills.
 */

export const REF_MAPPINGS = {
  'git-commit': 'git-commit',
  'interview-me': 'interview-me',
  'skill-creator': 'skill-creator',
  'code-simplification': 'code-simplification',
  'doubt-driven-development': 'doubt-driven-development',
};

export const CUSTOM_EVALS = {
  backend: {
    evals: [
      {
        id: 1,
        prompt: "Створи новий CQRS query handler для отримання списку постачальників з cursor pagination у services/backend-api.",
        expected_output: "Enforces 1 handler per file, CQRS structure, DTO validation via class-validator, and executes pnpm --filter @smartfeed/backend-api build.",
        expectations: [
          "Creates a single handler class in its own dedicated file with DTO validation",
          "Implements cursor pagination instead of OFFSET (L-040)",
          "Mandates production build check pnpm --filter @smartfeed/backend-api build to keep dist/ synchronized",
        ],
      },
      {
        id: 2,
        prompt: "Реалізуй оновлення налаштувань організації з блокуванням паралельних змін у БД.",
        expected_output: "Enforces distributed Redis mutex lock on organization mutations (L-032) and checks Layer-2 subscription quota bounds before committing.",
        expectations: [
          "Acquires distributed Redis mutex to prevent concurrent mutation race conditions",
          "Enforces Layer-2 subscription quota checks before applying state changes",
          "Never uses type bypasses in Prisma query clauses or DTO definitions",
        ],
      },
      {
        id: 3,
        prompt: "Напиши React компонент діалогового вікна редагування товару для apps/desktop.",
        expected_output: "Recognizes that React components and client UI belong strictly to the frontend skill and routes the request accordingly.",
        expectations: [
          "Recognizes that React views and client components are outside the backend domain",
          "Delegates UI implementation to frontend skill and official shadcn components",
          "Focuses strictly on backend CQRS API endpoints and contracts",
        ],
      },
    ],
  },
  frontend: {
    evals: [
      {
        id: 1,
        prompt: "Створи сторінку списку товарів у apps/admin-portal з таблицею та діями над рядками.",
        expected_output: "Composes view strictly from official shadcn components, enforces 100% solid sticky header (UI-01), semantic tokens (UI-02), and modular decomposition (<250 lines per file).",
        expectations: [
          "Uses official shadcn UI primitives (@/components/ui/*) without raw HTML controls",
          "Enforces solid sticky header on table (thead.sticky.top-0 bg-card)",
          "Decomposes view into sub-components (*TableRow.tsx, *Header.tsx) to stay under 250 lines",
        ],
      },
      {
        id: 2,
        prompt: "Додай кнопку експорту каталогу в CSV з захистом від подвійного кліку та локалізацією.",
        expected_output: "Uses useRef in-flight request deduplication, bilingual dictionary keys (UK/EN), and semantic button variants.",
        expectations: [
          "Implements request deduplication using useRef to prevent concurrent duplicate submissions",
          "Uses bilingual i18n keys without raw hardcoded text strings",
          "Applies official shadcn Button with accessible focus rings and loading state",
        ],
      },
      {
        id: 3,
        prompt: "Створи нову міграцію Prisma для додавання індексу на поле organizationId у PostgreSQL.",
        expected_output: "Recognizes that database schema changes and Prisma migrations belong strictly to backend and prisma-postgres-mastery skills.",
        expectations: [
          "Recognizes that database migrations and Prisma schemas belong to backend/database domain",
          "Directs schema changes to backend and prisma-postgres-mastery skills",
          "Maintains frontend focus on React views, shadcn components, and client state",
        ],
      },
    ],
  },
  review: {
    evals: [
      {
        id: 1,
        prompt: "Проведи 5-осьовий аудит pull request з новими ендпоінтами платежів WayForPay.",
        expected_output: "Performs read-only audit across Architecture (CQRS 1 handler/file), Security (Layer 1-4, webhook signature verification), Database (FK indexes), UI/UX, and Invariants without modifying the worktree.",
        expectations: [
          "Operates in strictly read-only mode without modifying production source code files",
          "Verifies webhook signature verification, replay protection, and Redis idempotency tokens",
          "Checks for zero unindexed foreign keys and 100% DTO validation",
        ],
      },
      {
        id: 2,
        prompt: "Перевір зміни у файлі feeds.controller.ts на відповідність бюджету рядків та відсутність заборонених типів.",
        expected_output: "Validates CORE-03 (zero type bypasses), CORE-04 (file budget <250 lines), and emits an Actionable Fix Report.",
        expectations: [
          "Audits file against CORE-03 (zero type bypasses) and CORE-04 (<250 lines budget)",
          "Reports findings with specific file:line pointers and concrete remediation steps",
          "Does not dump large text sheets or diffs into chat; persists task in plans/active/",
        ],
      },
      {
        id: 3,
        prompt: "Напиши реалізацію нового сервісу для парсингу Rozetka XML фідів у backend-api.",
        expected_output: "Recognizes that code authoring and feature implementation belong to backend / streaming-large-feeds, maintaining review strictly to auditing.",
        expectations: [
          "Refuses to author production feature implementation directly in review mode",
          "Directs feature writing to backend and streaming-large-feeds skills",
          "Emphasizes that review agent acts as an independent auditor and gatekeeper",
        ],
      },
    ],
  },
  'ui-ux-pro-max': {
    evals: [
      {
        id: 1,
        prompt: "Розроби макет панелі керування організацією з таблицею користувачів та формами запрошення.",
        expected_output: "Applies 100% official shadcn primitives, semantic tokens (bg-card, text-foreground), 100% solid sticky headers, unblocked paste on inputs, and micro-typography.",
        expectations: [
          "Uses official shadcn UI primitives (@/components/ui/*) with zero hand-rolled HTML controls",
          "Enforces 100% solid sticky table headers with semantic card background",
          "Applies form input hygiene (unblocked paste, spellCheck={false} on technical fields)",
        ],
      },
      {
        id: 2,
        prompt: "Додай кольорові бейджі та яскраві неонові градієнти для кнопок дій у таблиці товарів.",
        expected_output: "Rejects off-scheme rainbow/circus palette colors and AI-slop tropes, enforcing semantic badges (neutral/destructive/success) and singular boldness doctrine (UI-02, UI-07, UI-13).",
        expectations: [
          "Enforces semantic token palette (bg-primary, bg-muted, destructive) instead of arbitrary rainbow colors",
          "Rejects neon gradients and AI-slop decorative styling in favor of singular boldness",
          "Ensures hover-revealed row actions maintain high-density desktop geometry",
        ],
      },
      {
        id: 3,
        prompt: "Оптимізуй SQL запит з join для вибірки 100 000 товарів у PostgreSQL.",
        expected_output: "Recognizes that database query optimization belongs to postgresql-optimization and prisma-postgres-mastery skills.",
        expectations: [
          "Recognizes that SQL performance and EXPLAIN ANALYZE belong to database skills",
          "Delegates query optimization to postgresql-optimization skill",
          "Maintains focus on semantic UI tokens, typography, and shadcn design system",
        ],
      },
    ],
  },
  'playwright-automation': {
    evals: [
      {
        id: 1,
        prompt: "Напиши автоматизований тест для перевірки створення та фільтрації товарів у Server Admin Portal.",
        expected_output: "Authors isolated spec in e2e/server/admin/ using Page Object Model, web-first locators (getByTestId, getByRole), and real business data assertions without waitForTimeout.",
        expectations: [
          "Places test strictly in e2e/ package using Page Object Model architecture",
          "Uses web-first locators and web-first assertions without arbitrary waitForTimeout (TEST-09)",
          "Uses isolated test prefixes e2e.<runId> and ensures cleanDatabase teardown",
        ],
      },
      {
        id: 2,
        prompt: "Додай перевірку двомовності (UA <-> EN) перемикача мов у панелі адміністратора.",
        expected_output: "Tests bilingual localization parity, asserting localized strings on UI elements across both locales.",
        expectations: [
          "Asserts real localized UI labels across both Ukrainian and English locales",
          "Verifies language persistence across page navigations without page refresh glitches",
          "Maintains strict test isolation and deterministic cleanDatabase cleanup",
        ],
      },
      {
        id: 3,
        prompt: "Додай нову таблицю product_categories у схему schema.prisma.",
        expected_output: "Recognizes that Prisma schema changes belong to prisma-postgres-mastery and backend skills, not QA test automation.",
        expectations: [
          "Recognizes that Prisma ORM schemas belong to backend domain",
          "Directs schema authoring to prisma-postgres-mastery and backend skills",
          "Restricts QA automation strictly to e2e/ test specs and Page Objects",
        ],
      },
    ],
  },
  'prisma-postgres-mastery': {
    evals: [
      {
        id: 1,
        prompt: "Додай нову модель SupplierFeedSource у schema.prisma з зв'язком до Supplier.",
        expected_output: "Enforces 100% FK indexes (@@index([supplier_id])), @db.Timestamptz(6), @@map snake_case naming, CUID primary key, and cascade deletes.",
        expectations: [
          "Adds explicit @@index on foreign key supplier_id (100% FK index invariant)",
          "Uses @db.Timestamptz(6) for all DateTime timestamp columns",
          "Maps model and fields to snake_case table and column names via @@map and @map",
        ],
      },
      {
        id: 2,
        prompt: "Оптимізуй вибірку пов'язаних категорій та постачальників, щоб усунути N+1 проблему.",
        expected_output: "Uses Prisma include/select or batch query to eliminate N+1 query loops (L-039).",
        expectations: [
          "Eliminates N+1 loop by fetching relations in a single query via include/select",
          "Avoids fetching unbounded datasets without cursor-based pagination",
          "Never uses type bypasses in Prisma query options or where clauses",
        ],
      },
      {
        id: 3,
        prompt: "Створи Tailwind анімацію для модального вікна завантаження файлу.",
        expected_output: "Recognizes that Tailwind CSS animations belong to frontend and emil-design-eng skills.",
        expectations: [
          "Recognizes that CSS animation and styling belong to frontend engineering",
          "Directs styling to emil-design-eng and frontend skills",
          "Maintains focus on Prisma ORM, migrations, and PostgreSQL 16 schemas",
        ],
      },
    ],
  },
  'security-and-hardening': {
    evals: [
      {
        id: 1,
        prompt: "Захисти ендпоінт імпорту фіду від SSRF атак на локальні адреси та хмарні метадані.",
        expected_output: "Enforces DNS resolution before fetch, blocks private IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254, 192.168.0.0/16), and uses safe HTTP client with IP pinning.",
        expectations: [
          "Validates destination URL IP resolution against private/loopback/cloud metadata IP ranges",
          "Applies DNS pinning to prevent Time-of-Check to Time-of-Use (TOCTOU) SSRF re-binding",
          "Rejects URLs targeting internal monorepo ports (4000, 5432, 6379, 9000)",
        ],
      },
      {
        id: 2,
        prompt: "Перевір модуль автентифікації на наявність витоків паролів та токенів у логах або Sentry.",
        expected_output: "Enforces secret masking, sanitizes serialization sinks (JSON.stringify, logger), and prevents plaintext credential logging.",
        expectations: [
          "Masks sensitive fields (password, token, apiKey, secret) before logging or telemetry sinks",
          "Verifies user entities strip passwordHash before returning JSON responses",
          "Enforces zero hardcoded fallback secrets in configuration files",
        ],
      },
      {
        id: 3,
        prompt: "Зміни розмір шрифту та відступи у картці товару в apps/desktop.",
        expected_output: "Recognizes that visual styling and typography belong to frontend and ui-ux-pro-max skills.",
        expectations: [
          "Recognizes that UI styling and spacing belong to frontend domain",
          "Delegates UI design changes to frontend and ui-ux-pro-max skills",
          "Maintains focus on application security, OWASP hardening, and secret defense",
        ],
      },
    ],
  },
};

