# 🐳 Локальна Інфраструктура Docker Compose — SmartFeed Studio

## 📌 Огляд Контейнерів

Для локальної розробки та E2E тестування розгорнуто повний стек інфраструктури за допомогою `docker-compose.yml`:

```mermaid
graph LR
    subgraph Host["💻 Хост-машина розробника"]
        Backend["NestJS API (:4000)"]
    end

    subgraph Docker["🐳 Docker Network (smartfeed-network)"]
        Postgres[("PostgreSQL 16\nПорт: 5432\nБД: smartfeed_db")]
        Redis[("Redis 7 (Alpine)\nПорт: 6379\nКеш та Черги")]
        MinIO[("MinIO Object Storage\nПорт API: 9000\nКонсоль: 9001")]
        Mailpit[("Mailpit SMTP & Web\nSMTP: 1025\nWeb UI: 8025")]
    end

    Backend -->|SQL запити| Postgres
    Backend -->|BullMQ черги| Redis
    Backend -->|Presigned URL| MinIO
    Backend -->|Nodemailer SMTP| Mailpit
```

---

## ⚙️ Конфігурація Сервісів та Порти

| Сервіс            | Образ                    | Внутрішній порт | Зовнішній порт | Облікові дані                                                      |
| :---------------- | :----------------------- | :-------------- | :------------- | :----------------------------------------------------------------- |
| **PostgreSQL**    | `postgres:16-alpine`     | `5432`          | `5432`         | User: `postgres`<br>Pass: `postgrespassword`<br>DB: `smartfeed_db` |
| **Redis**         | `redis:7-alpine`         | `6379`          | `6379`         | Без пароля (локальний dev)                                         |
| **MinIO API**     | `minio/minio:latest`     | `9000`          | `9000`         | User: `minioadmin`<br>Pass: `minioadminpassword`                   |
| **MinIO Console** | `minio/minio:latest`     | `9001`          | `9001`         | Доступ через браузер: `http://localhost:9001`                      |
| **Mailpit Web**   | `axllent/mailpit:latest` | `8025`          | `8025`         | Веб-панель листів: `http://localhost:8025`                         |
| **Mailpit SMTP**  | `axllent/mailpit:latest` | `1025`          | `1025`         | Локальний SMTP сервер без авторизації                              |

---

## 🛠 Корисні Команди для Роботи з Інфраструктурою

### Запуск та зупинка контейнерів

```bash
# Підняти всі контейнери у фоновому режимі
pnpm docker:up
# (або пряма команда) docker compose up -d

# Зупинити всі контейнери
pnpm docker:down
# (або пряма команда) docker compose down

# Переглянути стан запущених контейнерів
docker compose ps
```

### Синхронізація та заповнення бази даних

```bash
# Накатати схему Prisma без створення файлів міграцій
pnpm --filter @smartfeed/backend-api exec prisma db push

# Виконати сідування початкових даних (Суперадмін, Тарифні плани, Навігація)
pnpm prisma:seed

# Запустити веб-інтерфейс Prisma Studio (порт 5555)
pnpm prisma:studio
```

### Поштовий сервіс та перегляд листів (Mailpit)

```bash
# Відкрити веб-інтерфейс перегляду вихідних email-листів у браузері (порт 8025)
pnpm mail:open

# Переглянути логи роботи локального SMTP сервера
pnpm mail:logs
```

---

## 🔍 Підключення до БД через GUI Клієнти (TablePlus, DBeaver, DataGrip)

- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgrespassword`
- **Database**: `smartfeed_db`
- **Connection URI**:
  ```text
  postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public
  ```
