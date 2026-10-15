---
name: bullmq-jobs
description: Asynchronous job queue processing with NestJS 11 and BullMQ on Redis 7. Governs bounded retries, exponential backoff, dead letter queues (DLQ), worker concurrency, memory backpressure, and idempotent processors.
rules:
  - core
  - backend
---

# BullMQ Job Queues

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/backend.md`.
2. Note all queue and concurrency invariants in working notes.
3. If using BullMQ APIs, call context7: `resolve-library-id {libraryName: "bullmq", query: "..."}` and `query-docs`.
4. Do not write queue producers or processors until steps 1-3 are complete.

## Queue architecture and job design

1. Bounded retries with exponential backoff: Every job added to a queue must specify bounded attempts (3 to 5) and exponential backoff with delay (e.g., `attempts: 5`, `backoff: { type: 'exponential', delay: 3000 }`).
2. Payload size limits: Never store large XML/CSV files or full product arrays in Redis job data. Pass only lightweight metadata references (`{ feedId, storageKey, organizationId }`).
3. Retention limits: Configure `removeOnComplete: { count: 100 }` and `removeOnFail: { count: 500 }` to prevent Redis memory exhaustion while retaining audit trails.
4. Idempotent worker execution: Workers must tolerate retries without creating duplicate rows or double-billing. Use deterministic `jobId` values (e.g., `feed-${feedId}-${syncTimestamp}`) and perform database status updates conditionally (`WHERE status = 'PENDING'`).
5. Dead letter queue handling: When jobs exhaust retry attempts, capture failed jobs in a dead letter queue or log structured error reports to Sentry. Never silently drop failed jobs.
6. Graceful worker shutdown: Ensure workers complete current operations or release locks when SIGTERM is received. Enable NestJS shutdown hooks (`app.enableShutdownHooks()`).
7. Redis inspection: Use the `redis` MCP server to inspect queue states (`LLEN bull:<queue>:wait`, `ZCARD bull:<queue>:failed`, `HGETALL bull:<queue>:<jobId>`).
