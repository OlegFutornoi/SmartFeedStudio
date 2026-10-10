---
name: bullmq-jobs
description: Production-grade asynchronous job queue engineering with NestJS 11 and BullMQ. Governs job retries, exponential backoff, dead letter queues (DLQ), worker concurrency, memory backpressure during large feed imports (100k+ SKUs), idempotent processing, and graceful shutdown. Use when designing or debugging background workers, feed sync jobs, email queues, or image processing pipelines.
---

# 🐂 BullMQ Job Queues & Asynchronous Processing Mastery

## 📌 Architecture & Responsibilities

In SmartFeed Studio, heavy operations (feed parsing, catalog exports, image sync, email dispatch) are offloaded from HTTP threads into Redis-backed BullMQ queues:

- **Module**: `services/backend-api/src/modules/feeds` and `services/backend-api/src/modules/mail`
- **Infrastructure**: Redis 7 on port 6379 via `BullModule.forRootAsync()` in `AppModule`

---

## 🔒 Iron Rules for Queue Architecture

### 1. Exponential Backoff & Finite Retries

Every queued job **MUST** define bounded retry attempts with exponential backoff:

```typescript
await this.feedQueue.add(
  'process-feed',
  { feedId, organizationId },
  {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000, // 3s, 6s, 12s, 24s, 48s
    },
    removeOnComplete: { count: 100 }, // Keep last 100 completed for audit
    removeOnFail: { count: 500 }, // Retain failed jobs for DLQ investigation
  },
);
```

### 2. Idempotent Processors

Workers can be retried or restarted during network hiccups. The worker **MUST** be idempotent:

- Use unique job IDs (`jobId: \`feed-\${feedId}-\${syncTimestamp}\``) to prevent duplicate jobs.
- Update database statuses inside transactions with conditional checks (`WHERE status = 'PENDING'`).

### 3. Memory Backpressure on 100k+ SKU Feeds

Never accumulate full XML/CSV feed payloads in Redis job data or worker memory:

- Job payload passes only metadata: `{ feedId, storageKey, tenantId }`.
- The worker streams the file using SAX/CSV streaming and batches DB inserts (`bulkUpsert` in chunks of 500-1000 items).

### 4. Graceful Shutdown

All workers must complete in-flight transactions or pause cleanly upon SIGTERM:

- Enable `app.enableShutdownHooks()` in `main.ts` (already active).
- Handlers should check worker token cancellation if processing long loops.

---

## 🔍 Monitoring & Debugging with Redis MCP

Use `redis-mcp-server` via `call_mcp_tool` (`ServerName: "redis"`) to inspect queues:

- Check waiting jobs: `LLEN bull:process-feed:wait`
- Check failed jobs: `ZCARD bull:process-feed:failed`
- Inspect active jobs: `HGETALL bull:process-feed:<jobId>`

---

## ✅ Pre-Completion Checklist

- [ ] Jobs configure bounded `attempts` and exponential `backoff`
- [ ] Large payloads (files/items) are not stored in Redis job data; only storage references
- [ ] Worker processor handles idempotency and doesn't create duplicate database records
- [ ] Failed jobs are tracked and logged to Sentry / structured logger
