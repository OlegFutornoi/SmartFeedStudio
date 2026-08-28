# 🛠️ План Міграції: Оновлення до Prisma ORM v7 (Prisma 7 Upgrade)

> **Статус:** ✅ Реалізовано  
> **Skill:** `.agents/skills/prisma-upgrade-v7`  
> **Ціль:** Оновити ORM шар `services/backend-api` з Prisma v6 (`6.19.3`) до стабільної Prisma v7 (`7.10.0`) з підтримкою Driver Adapters (`@prisma/adapter-pg`), типізованої конфігурації `prisma.config.ts` та WebAssembly архітектури.

---

## 📌 Ціль та Переваги Міграції

1. **Rust-Free Архітектура**: Відмова від нативних platform-dependent бінарників Rust на користь Wasm/JS, що значно полегшує Docker-образи та усуває конфлікти версій OpenSSL у контейнерах.
2. **PostgreSQL Driver Adapter (`@prisma/adapter-pg`)**: Нативний пул з'єднань через драйвер `pg`, що забезпечує стабільність з'єднань при високому навантаженні синхронізації каталогів.
3. **Типізована конфігурація `prisma.config.ts`**: Централізований файл конфігурації замість застарілого блоку `package.json#prisma`.
4. **Збереження CommonJS сумісності**: Використання опції `moduleFormat = "cjs"` у генераторі `prisma-client` для безшовної інтеграції з NestJS 11 та Jest E2E.

---

## 🏛 Архітектурний План Змін

### Етап 1. Оновлення залежностей (`services/backend-api/package.json`)

- Встановити:
  - `prisma@^7.6.0` (devDependencies)
  - `@prisma/client@^7.6.0` (dependencies)
  - `@prisma/adapter-pg@^7.6.0` (dependencies)
  - `pg@^8.13.0` та `@types/pg`
  - `dotenv`

### Етап 2. Налаштування `prisma.config.ts`

Створити `services/backend-api/prisma.config.ts`:

```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

### Етап 3. Оновлення Схеми (`prisma/schema.prisma`)

- Оновити блок `generator client`:
  ```prisma
  generator client {
    provider     = "prisma-client"
    output       = "../generated/prisma"
    moduleFormat = "cjs"
  }
  ```
- Очистити блок `datasource db` (видалити застарілий `url = env("DATABASE_URL")`, оскільки він тепер у `prisma.config.ts`).

### Етап 4. Адаптація `PrismaService` (`src/prisma/prisma.service.ts`)

Ініціалізація `PrismaPg` адаптера поверх пулу PostgreSQL:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL via Prisma 7 PG Driver Adapter');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
```

### Етап 5. Оновлення Імпортів

- Оновити імпорти `Prisma` та помилок `PrismaClientKnownRequestError` у:
  - `src/common/filters/http-exception.filter.ts`
  - Сервісах та хендлерах, що використовують типи Prisma.
- Додати директорію `services/backend-api/generated/` до `.gitignore`.

### Етап 6. Верифікація та Запуск Тестів

1. `pnpm --filter @smartfeed/backend-api exec prisma generate`
2. `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
3. `pnpm --filter @smartfeed/backend-api test:e2e` (усі 61 тест мають пройти успішно)
4. `pnpm test:desktop` (22 тести) та `pnpm test:admin` (13 тестів) — сумарно 96 тестів (100% PASS).
5. `pnpm format`

---

## ⚠️ Правило 10: Зупинка перед виконанням

Згідно з Правилом 10 (`Mandatory Plan Review & Explicit User Command Before Execution Policy`), агент **НЕ ПОЧИНАЄ** змінювати файли конфігурації, `package.json` чи `schema.prisma`.

Агент презентує цей план користувачу та очікує явної команди: **"виконуй" / "починай" / "роби"**.
