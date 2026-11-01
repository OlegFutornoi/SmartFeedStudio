# BullMQ Retries, Jitter & Dead-Letter Queue (DLQ) Architecture

## 1. Resilient Retries Configuration (Retry with Jitter)

Retrying requests simultaneously across all workers causes the thundering herd problem, risking DB or downstream service starvation.
Configure exponential backoff with jitter:

```typescript
export const resilientJobOptions = {
  attempts: 4,
  backoff: {
    type: 'exponential',
    delay: 3000, // 3s, 6s, 12s, 24s (+ randomized jitter)
  },
  removeOnComplete: {
    count: 200,
    age: 24 * 3600, // 24 hours
  },
  removeOnFail: false, // Retain failed jobs for inspection in DLQ
};
```

## 2. Dead-Letter Queue (DLQ) Handling Pattern

When a job exhausts all `attempts: 4`, BullMQ marks it as `failed`.
A dedicated DLQ listener intercepts permanent failures:

```typescript
import { QueueEvents } from 'bullmq';
import * as Sentry from '@sentry/node';

export function setupDeadLetterMonitoring(queueName: string, connection: any) {
  const queueEvents = new QueueEvents(queueName, { connection });

  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    console.error(
      `[DLQ Alert] Job ${jobId} in queue ${queueName} permanently failed: ${failedReason}`,
    );

    // Send structured alert to Sentry tagged with queue and jobId
    Sentry.captureException(new Error(`BullMQ DLQ: ${failedReason}`), {
      tags: {
        queue: queueName,
        jobId,
        dlq: 'true',
      },
      extra: {
        jobId,
        failedReason,
      },
    });
  });
}
```

## 3. Non-Retryable Errors

If an error is deterministic (such as schema validation failure or supplier `401 Unauthorized`), retries consume resources fruitlessly:

```typescript
export class UnrecoverableJobError extends Error {
  readonly isUnrecoverable = true;
}

// Inside BullMQ worker:
try {
  await processChunk(job.data);
} catch (err: any) {
  if (err instanceof InvalidXmlSchemaException || err.status === 401) {
    // Throw BullMQ UnrecoverableError to halt retries immediately
    throw new UnrecoverableError(`Fatal error: ${err.message}. Retries aborted.`);
  }
  throw err; // Transient error (network timeout, connection reset) - BullMQ retries
}
```
