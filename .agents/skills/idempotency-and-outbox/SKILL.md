---
name: idempotency-and-outbox
version: 1.0.0
description: 'Use for resilient CQRS mutations: Idempotency keys, Transactional Outbox pattern with Prisma, BullMQ retry with exponential backoff, and Dead-Letter Queue (DLQ) processing.'
metadata:
  requires:
    packages: ['bullmq', 'ioredis', '@prisma/client']
---

# idempotency-and-outbox

Інженерний стандарт надійності мутацій даних у SmartFeed Studio: захист від повторних запитів, надійна публікація подій через Transactional Outbox та ізоляція збоїв через Dead-Letter Queue (DLQ).

## Залізні принципи надійності та ідемпотентності

1. **Ідемпотентність мутацій (Idempotency Key)**: Будь-яка критична операція створення або зміни (імпорт фіду, списання кредитів, оновлення плану, масове видалення) зобов'язана приймати `idempotencyKey`. Повторний запит з тим самим ключем повертає збережений результат першої операції замість повторного виконання.
2. **Transactional Outbox замість подій у транзакції**: Заборонено викликати зовнішні сервіси, черги BullMQ або сокети всередині `$transaction()`. Подія записується в таблицю `outbox_events` у тій же транзакції, а фоновий релей публікує її в Redis/BullMQ.
3. **At-Least-Once доставка з дедуплікацією**: Споживачі подій (BullMQ воркери) зобов'язані проектувати свої обробники як ідемпотентні, використовуючи унікальний `eventId` або композитний ключ об'єкта.
4. **Контрольовані Retry та DLQ**: Усі фонові задачі повинні мати ліміт спроб (3-5), експоненційний backoff з рандомізацією (jitter) та автоматичне перенесення невідновлюваних помилок у Dead-Letter Queue з алертом у Sentry.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                        | Цільовий reference-файл                                                                  | Ключовий фокус                                                                 |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| Захист API та CQRS команд від повторних кліків/дублів   | [`references/idempotency-keys-and-cqrs.md`](references/idempotency-keys-and-cqrs.md)     | Перевірка `X-Idempotency-Key`, Redis SETNX блокування, кешування результату    |
| Надійна доставка подій між БД та асинхронними воркерами | [`references/transactional-outbox-prisma.md`](references/transactional-outbox-prisma.md) | Таблиця `outbox_events`, атомарний запис у Prisma `$transaction`, Relay-воркер |
| Налаштування повторних спроб, ізоляція отруйних задач   | [`references/bullmq-dlq-and-retry.md`](references/bullmq-dlq-and-retry.md)               | Backoff + jitter, Dead-Letter Queue (DLQ), обробка fatal non-retryable помилок |

## Категорично заборонено

- Публікувати повідомлення в BullMQ чи Redis безпосередньо всередині блоку `$transaction()` БД (ризик втрати узгодженості при відкаті транзакції).
- Виконувати повторювані фонові задачі без експоненційного backoff (це призводить до шторму запитів під час збоїв).
- Ковтати помилки черги без реєстрації в Dead-Letter Queue та трейсингу Sentry.
- Створювати недетерміновані `idempotencyKey` на стороні сервера для клієнтських операцій (ключ генерується клієнтом).
