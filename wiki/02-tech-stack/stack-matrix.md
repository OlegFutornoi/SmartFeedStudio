# 📊 Матриця Технологічного Стеку — SmartFeed Studio

## 🛠 Технології за Рівнями Системи

| Рівень                    | Технологія / Бібліотека      | Версія                          | Призначення в проекті                                                 |
| :------------------------ | :--------------------------- | :------------------------------ | :-------------------------------------------------------------------- |
| **Monorepo**              | `pnpm` workspaces            | 9.x                             | Управління залежностями без дублювання, ізольовані node_modules       |
| **Monorepo Build**        | `Turborepo` (`turbo`)        | 2.x                             | Паралелізація збирання, кешування результатів білду                   |
| **Backend Framework**     | `NestJS`                     | 11.x                            | Модульний корпоративний TypeScript фреймворк                          |
| **Backend Architecture**  | `@nestjs/cqrs`               | 11.x                            | Реалізація шаблону Command Query Responsibility Segregation           |
| **ORM**                   | `Prisma ORM`                 | 6.x                             | Типізований доступ до БД, схема `schema.prisma`, міграції             |
| **Database**              | `PostgreSQL`                 | 16.x                            | Реляційне сховище користувачів, планів, ліцензій, навігації           |
| **Message Queue / Cache** | `Redis`                      | 7.x                             | Черги фонових задач (BullMQ) та кеш                                   |
| **Object Storage**        | `MinIO` / AWS S3 SDK         | `@aws-sdk/s3-request-presigner` | Хмарне сховище для знімків каталогів та зображень товарів             |
| **Desktop Host**          | `Tauri`                      | 2.x                             | Легкий нативний контейнер поверх системного WebView                   |
| **Desktop Core**          | `Rust`                       | 2021 edition                    | Швидкодія, шифрування SQLCipher (`rusqlite`), OS Keychain (`keyring`) |
| **Desktop Web UI**        | `React` + `Vite`             | React 18, Vite 6                | Швидкий SPA інтерфейс користувача                                     |
| **Admin Portal**          | `Next.js` (App Router)       | 14.2.x                          | SSR/SSG веб-панель керування платформою                               |
| **UI Design System**      | `shadcn/ui` + `Tailwind CSS` | Tailwind 3.4                    | Компонентна система на основі Radix UI та HSL токенів                 |
| **Icons**                 | `lucide-react`               | Latest                          | Уніфіковані векторні іконки                                           |
| **Validation**            | `Zod` + `class-validator`    | Zod 3.x                         | Двостороння валідація DTO (і на фронтенді, і на бекенді)              |
| **i18n Engine**           | Кастомний Chunks Loader      | React Context                   | 100% локалізація (`uk` ⇄ `en`), ледача підгрузка JSON словників       |
| **Desktop E2E QA**        | `@playwright/test`           | 1.50.x                          | Автоматизоване тестування користувацьких сценаріїв десктопу           |
| **Admin E2E QA**          | `@playwright/test`           | 1.50.x                          | Тестування адмін-панелі за патерном Page Object Model (POM)           |
| **Backend E2E QA**        | `Jest` + `supertest`         | Jest 29                         | Інтеграційні E2E тести контролерів та CQRS хендлерів                  |
| **Code Style**            | `ESLint` 9 + `Prettier`      | Flat Config                     | Єдиний стиль коду, автоматичне форматування (`pnpm format`)           |

---

## 📦 Спільний Пакет `@smartfeed/shared`

Пакет `packages/shared` компілюється в JavaScript та `.d.ts` декларації (`pnpm build:shared`). Він імпортується усіма додатками (`services/backend-api`, `apps/admin-portal`, `apps/desktop`) і містить:

1. **Контракти CQRS (`contracts/cqrs.ts`)**:
   - Інтерфейси сутностей (`UserEntity`, `LicenseEntity`, `PresignedUploadUrlResult`).
   - Корисні навантаження команд та запитів (`CreateUserCommandPayload`, `UserCreatedEventPayload`).
2. **DTO та Zod Схеми (`dtos/`)**:
   - `auth.dto.ts`: `LoginDtoSchema`, `RegisterDtoSchema`, `AuthResponseDto`.
   - `license.dto.ts`: `LicenseDtoSchema`, `SelectTariffPlanDtoSchema`.
   - `tariff-plan.dto.ts`: `TariffPlanDtoSchema`, `CreateTariffPlanDtoSchema`, `UpdateTariffPlanDtoSchema`.
   - `navigation.dto.ts`: `NavigationItemDtoSchema`, `CreateNavigationItemDtoSchema`.
3. **Перелічення Enum (`enums/`)**:
   - `Role`: `SUPER_ADMIN`, `ADMIN`, `USER`.
   - `PlanType`: `STARTER`, `GROWTH`, `PRO`, `ENTERPRISE`.
   - `TargetApp`: `DESKTOP`, `ADMIN_PORTAL`, `ALL`.
