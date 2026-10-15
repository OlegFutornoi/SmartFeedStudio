---
name: idempotency-and-outbox
description: Idempotency keys, Transactional Outbox pattern with Prisma, BullMQ retry mechanics, and Dead-Letter Queue processing for resilient CQRS mutations. Use when designing mutation handlers, webhook publishing, or payment event processing.
rules:
  - core
  - backend
  - database
---

# Idempotency and Transactional Outbox

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, and `.agents/rules/database.md`.
2. Note all idempotency and outbox invariants in working notes.
3. If using Redis distributed locks or BullMQ events, call context7: `resolve-library-id {libraryName: "ioredis", query: "..."}` and `query-docs`.
4. Do not implement mutation logic until steps 1-3 are complete.

## Architecture and mutation reliability

1. Client-supplied idempotency keys: All critical mutations (feed import, credit deduction, plan changes, payment webhooks) must accept an idempotency key (header `X-Idempotency-Key` or body field). Duplicate requests with the same key must return the cached initial result without re-executing business logic.
2. Redis lock and caching: Check idempotency keys in Redis using atomic `SET key value EX seconds NX`. If key exists and processing is complete, return cached response immediately. If key is currently in-flight, return 409 Conflict or wait for completion.
3. Transactional Outbox pattern: Never publish messages to BullMQ, external HTTP webhooks, or WebSocket channels directly inside a Prisma `$transaction()` block. If the database transaction rolls back, external side effects cannot be reversed.
4. Outbox table persistence: Persist domain events in an `outbox_events` table within the same database transaction that updates business state. A dedicated background relay worker polls unpublished outbox records and publishes them to Redis/BullMQ.
5. At-least-once consumer delivery: Consumers of outbox events must be idempotent, deduplicating messages via unique `eventId` or composite entity identifiers.
6. Dead-Letter Queue: Configure bounded retries (3 to 5 attempts) with randomized exponential backoff (jitter). Unrecoverable errors must be pushed to a Dead-Letter Queue and reported to Sentry.
