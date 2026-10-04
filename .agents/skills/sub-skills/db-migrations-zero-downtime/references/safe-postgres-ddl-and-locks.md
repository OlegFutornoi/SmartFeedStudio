# Safe PostgreSQL DDL & Lock Timeout Management

## 1. Небезпека блокувань таблиць (Queue of Queues)

Коли виконується команда на кшталт `ALTER TABLE products ADD COLUMN ...`, PostgreSQL намагається взяти `AccessExclusiveLock`.
Якщо хоча б один повільний `SELECT` або транзакція вже тримає `AccessShareLock`, команда `ALTER TABLE` встає в чергу очікування. Усі наступні запити (навіть швидкі `SELECT`) блокуються позаду неї, вичерпуючи пул з'єднань і паралізуючи сервіс.

## 2. Канонічні правила захисту від зависань

Завжди огортайте міграційні скрипти жорсткими таймаутами:

```sql
-- Встановлюємо безпечні ліміти на очікування блокування
SET lock_timeout = '2s';
SET statement_timeout = '5s';

-- Безпечне додавання колонки (миттєво в PG 11+ для константних значень)
ALTER TABLE products ADD COLUMN IF NOT EXISTS status_v2 TEXT DEFAULT 'DRAFT';

-- Скидання таймаутів назад на дефолтні значення сесії
RESET lock_timeout;
RESET statement_timeout;
```

## 3. Створення індексів через `CONCURRENTLY`

Звичайний `CREATE INDEX` блокує всі операції запису (`INSERT`, `UPDATE`, `DELETE`) до завершення сканування таблиці.
У PostgreSQL необхідно використовувати `CONCURRENTLY`:

```sql
-- УВАГА: CONCURRENTLY не може виконуватися всередині блоку транзакції (BEGIN/COMMIT)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku_feed
ON products (feed_id, sku);
```

У Prisma для міграцій з `CONCURRENTLY` використовуйте окремий файл міграції без транзакційної обгортки (`--no-transaction` у Prisma CLI або спеціальний raw runner).

## 4. Безпечне додавання Foreign Key (NOT VALID -> VALIDATE)

Створення зв'язку через `ADD CONSTRAINT ... FOREIGN KEY` сканує всю таблицю для валідації і тримає блокування.
Правильний двоетапний підхід:

```sql
-- Крок 1: Миттєве додавання правила без перевірки старих даних (короткий lock)
ALTER TABLE products
ADD CONSTRAINT fk_products_feed
FOREIGN KEY (feed_id) REFERENCES feeds(id)
NOT VALID;

-- Крок 2: Фонова валідація існуючих даних без блокування запису
ALTER TABLE products
VALIDATE CONSTRAINT fk_products_feed;
```
