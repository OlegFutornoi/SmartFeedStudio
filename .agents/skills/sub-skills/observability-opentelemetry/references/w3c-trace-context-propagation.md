# W3C Trace Context Propagation (HTTP → CQRS → BullMQ)

## 1. Специфікація W3C `traceparent`

Формат заголовка W3C:
`traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`

- `00`: версія специфікації
- `4bf92f3577b34da6a3ce929d0e0e4736`: глобальний `traceId` (32 hex символи)
- `00f067aa0ba902b7`: батьківський `parentSpanId` (16 hex символів)
- `01`: прапори трейсингу (`01` = recorded/sampled)

## 2. Перехоплення та прокидання в NestJS Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';

export interface RequestContext {
  traceId: string;
  spanId: string;
  userId?: string;
  orgId?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const rawTraceparent = req.headers['traceparent'] as string;
    let traceId = '';
    let spanId = '';

    if (rawTraceparent && rawTraceparent.startsWith('00-')) {
      const parts = rawTraceparent.split('-');
      if (parts.length >= 4) {
        traceId = parts[1];
        spanId = parts[2];
      }
    }

    if (!traceId) {
      traceId = randomBytes(16).toString('hex');
      spanId = randomBytes(8).toString('hex');
    }

    // Встановлюємо заголовок відповіді для трасування клієнтом
    res.setHeader('x-trace-id', traceId);

    const context: RequestContext = { traceId, spanId };
    requestContextStorage.run(context, () => {
      next();
    });
  }
}
```

## 3. Прокидання Trace Context у BullMQ Jobs

Коли NestJS ставить фонову задачу в чергу (наприклад, імпорт фіду):

```typescript
// При додаванні в чергу:
const currentCtx = requestContextStorage.getStore();

await feedQueue.add('import-feed-chunk', {
  feedId,
  items,
  // Метадані трейсингу:
  _tracing: {
    traceId: currentCtx?.traceId,
    parentSpanId: currentCtx?.spanId,
  },
});
```

У BullMQ воркері відновлюємо контекст:

```typescript
const worker = new Worker('feeds', async (job) => {
  const { _tracing } = job.data;
  const ctx: RequestContext = {
    traceId: _tracing?.traceId || randomBytes(16).toString('hex'),
    spanId: randomBytes(8).toString('hex'),
  };

  await requestContextStorage.run(ctx, async () => {
    logger.info({ msg: 'Processing feed job chunk', jobId: job.id });
    await processJob(job);
  });
});
```
