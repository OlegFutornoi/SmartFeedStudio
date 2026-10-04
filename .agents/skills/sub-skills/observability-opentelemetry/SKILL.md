---
name: observability-opentelemetry
version: 1.0.0
description: 'Use for distributed tracing and structured logging: W3C traceparent propagation (UI -> NestJS -> Prisma -> BullMQ), AsyncLocalStorage correlation IDs, Pino JSON logs, and Sentry span bridging.'
metadata:
  requires:
    packages: ['@opentelemetry/api', 'pino', '@sentry/nestjs']
---

# observability-opentelemetry

Інженерний стандарт спостережуваності (Observability) у SmartFeed Studio: наскрізне трейсування розподілених запитів (W3C Trace Context), структуроване JSON-логування та зв'язування помилок у Sentry з точним контекстом виконання.

## Залізні принципи спостережуваності

1. **Єдиний Correlation ID / W3C Trace Context**: Кожен запит від користувача (з React/Next.js чи десктопного Tauri) генерує або прокидає заголовок `traceparent` (W3C Trace Context) або `x-correlation-id`. Цей ID автоматично супроводжує запит через HTTP-контролер, CQRS-команди, SQL-запити Prisma та бекграунд-задачі BullMQ.
2. **Нуль неструктурованого `console.log`**: Заборонено використовувати сирий `console.log('User created:', user)`. Усі логи повинні бути валідним JSON через Pino або Winston з обов'язковими полями: `timestamp`, `level`, `traceId`, `spanId`, `module`, `userId`, `organizationId`.
3. **Безпека секретів у логах (Redaction / Masking)**: Паролі, JWT токени, номери ліцензій, API-ключі та персональні дані користувачів (PII) **зобов'язані автоматично маскуватися** на рівні логера (`pino.redact: ['req.headers.authorization', 'password', 'key']`).
4. **Зв'язування Sentry з OpenTelemetry Spans**: При фіксації винятку в Sentry контекст помилки повинен автоматично містити `traceId` та поточні span attributes для миттєвої кореляції в панелі трейсингу.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                | Цільовий reference-файл                                                                      | Ключовий фокус                                                                           |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| Прокидання трейсів між HTTP, BullMQ та Prisma   | [`references/w3c-trace-context-propagation.md`](references/w3c-trace-context-propagation.md) | Заголовок `traceparent`, W3C специфікація, контекст BullMQ job data, OpenTelemetry Spans |
| Структуроване JSON логування, AsyncLocalStorage | [`references/structured-logging-pino.md`](references/structured-logging-pino.md)             | Pino конфігурація, `AsyncLocalStorage` для контексту запиту, маскування секретів         |
| Інтеграція трейсів Sentry з Distributed Spans   | [`references/sentry-opentelemetry-bridge.md`](references/sentry-opentelemetry-bridge.md)     | Sentry OpenTelemetry SDK, зв'язок exception -> traceId, атрибути продуктивності          |

## Категорично заборонено

- Використовувати `console.log()` для відладки продакшен-коду або бізнес-подій.
- Логувати сирі паролі, платіжні дані або повні JWT токени у відкритому вигляді.
- Втрачати `traceId` при постановці задачі в чергу BullMQ (id передається у метаданих задачі).
- Створювати нескінченні спани без закриття (`span.end()` зобов'язаний бути у `finally`).
