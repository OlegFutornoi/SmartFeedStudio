# BullMQ Retries, Jitter & Dead-Letter Queue (DLQ) Architecture

## 1. Конфігурація надійних повторів (Retry with Jitter)

Повторення запитів у той самий момент часу всіма воркерами спричиняє «thundering herd» ефект і добиває базу даних чи сторонній сервер.
Необхідно використовувати експоненційний backoff:

```typescript
export const resilientJobOptions = {
  attempts: 4,
  backoff: {
    type: 'exponential',
    delay: 3000, // 3s, 6s, 12s, 24s (+ рандомізований jitter)
  },
  removeOnComplete: {
    count: 200,
    age: 24 * 3600, // 24 години
  },
  removeOnFail: false, // Заборонено видаляти збійні задачі — вони йдуть в Failed / DLQ
};
```

## 2. Патерн обробки Dead-Letter Queue (DLQ)

Коли задача вичерпала всі спроби `attempts: 4`, BullMQ переводить її в статус `failed`.
Спеціалізований DLQ-лісенер перехоплює фінальний збій:

```typescript
import { QueueEvents } from 'bullmq';
import * as Sentry from '@sentry/node';

export function setupDeadLetterMonitoring(queueName: string, connection: any) {
  const queueEvents = new QueueEvents(queueName, { connection });

  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    console.error(
      `[DLQ Alert] Job ${jobId} in queue ${queueName} permanently failed: ${failedReason}`,
    );

    // Відправка структурованого алерта в Sentry з тегами черги та jobId
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

## 3. Фатальні помилки без повторів (Non-Retryable Errors)

Якщо помилка є детермінованою (наприклад, помилка валідації схеми або `401 Unauthorized` через невалідний API-ключ постачальника), повторні спроби марно витрачають ресурси:

```typescript
export class UnrecoverableJobError extends Error {
  readonly isUnrecoverable = true;
}

// У воркері:
try {
  await processChunk(job.data);
} catch (err: any) {
  if (err instanceof InvalidXmlSchemaException || err.status === 401) {
    // Викидаємо BullMQ UnrecoverableError, щоб негайно припинити retries
    throw new UnrecoverableError(`Фатальна помилка: ${err.message}. Повтор скасовано.`);
  }
  throw err; // Тимчасова помилка (timeout, мережа) — BullMQ здійснить retry
}
```
