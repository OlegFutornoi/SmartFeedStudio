# BullMQ Chunked Ingestion & Progress Architecture

## 1. Parent-Child Workflow Chunking Pattern

When processing catalogs with 100k+ SKUs:

1. Parent Job (`import-feed-parent`): Reads the feed stream via SAX, splits into chunks of 500-1000 SKUs, and dispatches subtasks directly to the child queue.
2. Child Jobs (`process-feed-chunk`): Process individual chunks in parallel (validation, pricing calculation, database upsert, counter increments).
3. Progress Aggregator: Atomically updates progress in Redis (`processedChunks / totalChunks`) using Redis `HINCRBY` for real-time UI reporting.

```typescript
import { Queue, FlowProducer } from 'bullmq';

export interface FeedChunkJobData {
  feedId: string;
  chunkIndex: number;
  totalEstimatedChunks?: number;
  items: Array<{
    sku: string;
    title: string;
    price: number;
    currency: string;
    vendor?: string;
  }>;
}

export async function enqueueFeedChunks(
  feedQueue: Queue,
  feedId: string,
  chunks: FeedChunkJobData[],
) {
  const jobs = chunks.map((chunk, idx) => ({
    name: 'process-feed-chunk',
    data: chunk,
    opts: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100, // Clean up completed jobs
      removeOnFail: 500, // Retain failed jobs for DLQ investigation
      jobId: `feed:${feedId}:chunk:${idx}`, // Idempotent job key
    },
  }));

  // Batch insertion to minimize Redis round-trips
  await feedQueue.addBulk(jobs);
}
```

## 2. Atomic Progress Updates for WebSocket/SSE in UI

Instead of each worker updating PostgreSQL (which creates N-way row locks on the feed entity), record progress in Redis and publish updates to connected clients:

```typescript
// Inside BullMQ worker:
async function onChunkCompleted(redis: Redis, feedId: string, totalChunks: number) {
  const completed = await redis.hincrby(`feed:${feedId}:progress`, 'completedChunks', 1);
  const percent = Math.min(100, Math.round((completed / totalChunks) * 100));

  await redis.publish(
    `feed:${feedId}:events`,
    JSON.stringify({
      type: 'FEED_PROGRESS_UPDATED',
      feedId,
      completedChunks: completed,
      totalChunks,
      percent,
    }),
  );
}
```

## 3. Queue Cascading Failure Defense Checklist

- Set `concurrency: 5-10` for ingestion workers to prevent PostgreSQL connection pool exhaustion (`Pool` default 20 connections).
- Use deterministic `jobId` based on `feedId` + `chunkIndex` to prevent duplicate processing on worker retries.
- Queue hygiene: `removeOnComplete: { count: 100, age: 3600 }` prevents Redis memory accumulation.
