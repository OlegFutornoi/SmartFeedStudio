---
name: db-migrations-zero-downtime
version: 1.0.0
description: 'Use for zero-downtime PostgreSQL schema changes: Expand/Contract pattern, non-blocking DDL locks, online background backfilling, and safe column migrations in Prisma.'
metadata:
  requires:
    packages: ['@prisma/client', 'pg']
---

# db-migrations-zero-downtime

Інженерний стандарт безпечних міграцій бази даних PostgreSQL без простою системи (Zero-Downtime) та без ексклюзивних блокувань таблиць у SmartFeed Studio.

## Залізні принципи міграцій без простою

1. **Патерн Expand/Contract (Паралельне існування)**: Жодна колонка чи таблиця не видаляється і не перейменовується в один крок. Будь-яка зміна виконується мінімум у 2-3 релізи:
   - **Фаза 1 (Expand)**: Додавання нового опціонального поля або таблиці; бекенд починає писати в обидва місця (Dual-Write).
   - **Фаза 2 (Backfill)**: Фонове перенесення історичних даних чанками без блокування читання.
   - **Фаза 3 (Contract)**: Перемикання читання тільки на нове поле; видалення старого поля в наступному релізі.
2. **Захист від блокувань (Zero Long-Lived Table Locks)**:
   - Перед кожною міграцією встановлюються `SET lock_timeout = '2s';` та `SET statement_timeout = '5s';`. Якщо блокування `ACCESS EXCLUSIVE` не отримано за 2 секунди, міграція відкатується, щоб не паралізувати робочі запити користувачів.
   - Індекси створюються виключно з прапором `CREATE INDEX CONCURRENTLY`.
3. **Заборона `DEFAULT` зі скануванням усієї таблиці**: Уникати додавання колонок з обчислюваними недетермінованими значеннями за замовчуванням без перевірки версії PostgreSQL (PostgreSQL 11+ підтримує швидкий додаток константних `DEFAULT`, але перевірка зовнішніх ключів вимагає `NOT VALID` з наступним `VALIDATE CONSTRAINT`).
4. **Ізоляція скриптів Backfill**: Скрипти міграції даних ніколи не запускаються всередині однієї гігантської транзакції. Вони виконуються батчами (по 500-1000 рядків) з мікро-паузами для зняття навантаження з реплікації.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                        | Цільовий reference-файл                                                                  | Ключовий фокус                                                                |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| Перейменування/видалення колонки, зміна типу даних      | [`references/expand-contract-pattern.md`](references/expand-contract-pattern.md)         | 3-фазний життєвий цикл Expand/Contract, Dual-Write, видалення старого поля    |
| Запобігання таймаутам і блокуванням `ACCESS EXCLUSIVE`  | [`references/safe-postgres-ddl-and-locks.md`](references/safe-postgres-ddl-and-locks.md) | `lock_timeout`, `statement_timeout`, `CREATE INDEX CONCURRENTLY`, `NOT VALID` |
| Фоновий перенос мільйонів рядків без блокування таблиць | [`references/data-backfill-scripts.md`](references/data-backfill-scripts.md)             | Батчевий backfill за курсором, паузи між чанками, моніторинг реплікації       |

## Категорично заборонено

- Перейменовувати існуючу колонку безпосередньо через `ALTER TABLE RENAME COLUMN` на працюючому продакшені (стара версія коду впаде з помилкою 500).
- Запускати `CREATE INDEX` без `CONCURRENTLY` на живих таблицях товарів або ліцензій.
- Робити `ALTER TABLE ADD COLUMN NOT NULL` без попереднього заповнення значень або дефолту.
- Виконувати бекфіл мільйона рядків одним SQL-запитом `UPDATE table SET ...` без чанкування.
