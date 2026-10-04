# BullMQ Chunked Ingestion & Progress Architecture

## 1. Патерн розбиття імпорту на чанки (Parent-Child Workflow)

Коли користувач імпортує каталог на 100k+ SKU:

1. **Parent Job (`import-feed-parent`)**: Читає потік фіду через SAX, розбиває на чанки по 500-1000 SKU, зберігає тимчасові пакети або передає їх безпосередньо в чергу підзадач.
2. **Child Jobs (`process-feed-chunk`)**: Паралельно обробляють окремі пакети (валідація, розрахунок цін, upsert у базу даних, оновлення лічильників).
3. **Progress Aggregator**: Атомарно оновлює прогрес у Redis (`processedChunks / totalChunks`) через Redis `HINCRBY` для відображення в UI.

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
      removeOnComplete: 100, // Авто-очищення завершених задач
      removeOnFail: 500, // Збереження невдалих задач для аналізу в DLQ
      jobId: `feed:${feedId}:chunk:${idx}`, // Ідемпотентний ID задачі
    },
  }));

  // Додавання пачкою для зниження навантаження на Redis
  await feedQueue.addBulk(jobs);
}
```

## 2. Атомарне оновлення прогресу для WebSocket/SSE в UI

Замість того, щоб кожен воркер писав прогрес у PostgreSQL (що створить N-кратне блокування таблиці фіду), прогрес фіксується в Redis і публікується клієнтам:

```typescript
// У BullMQ воркері:
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

## 3. Чеклист захисту від каскадних збоїв черг

- [ ] Встановлено `concurrency: 5-10` для воркерів імпорту, щоб не вичерпати пул з'єднань PostgreSQL (`Pool` 20 конекшнів).
- [ ] Використовується `jobId` на основі `feedId` + `chunkIndex` для запобігання дублюванню чанків при повторному старті.
- [ ] Очищення черги: `removeOnComplete: { count: 100, age: 3600 }` запобігає витокам пам'яті в Redis.
