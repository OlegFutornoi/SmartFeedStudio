# Idempotency Keys & CQRS Commands Architecture

## 1. Two-Phase Redis Idempotency Pattern

When a client submits sensitive state mutations (e.g., `POST /api/feeds/:id/import` or license updates), it supplies the header:
`X-Idempotency-Key: <uuid-v4>`

Processing stages:

1. Acquire Lock: Atomically set lock via Redis `SET key "PROCESSING" NX EX 120`.
   - If key exists with value `"PROCESSING"`, return `409 Conflict` (request currently in flight).
   - If key exists with cached response, return `200 OK` or `201 Created` without re-executing.
2. Execute Command: Run CQRS command via CommandBus.
3. Save Result: Store response payload in Redis `SET key <json-result> EX 86400` (24 hour TTL).

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyGuardHelper {
  constructor(private readonly redis: Redis) {}

  async handleIdempotency<T>(
    key: string,
    execute: () => Promise<T>,
    ttlSeconds = 86400,
  ): Promise<{ result: T; cached: boolean }> {
    const redisKey = `idempotency:${key}`;

    const acquired = await this.redis.set(
      redisKey,
      JSON.stringify({ status: 'PROCESSING' }),
      'EX',
      120,
      'NX',
    );

    if (!acquired) {
      const existing = await this.redis.get(redisKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed.status === 'PROCESSING') {
          throw new ConflictException(
            'Request with this Idempotency-Key is currently in progress.',
          );
        }
        return { result: parsed.data as T, cached: true };
      }
    }

    try {
      const result = await execute();
      await this.redis.set(
        redisKey,
        JSON.stringify({ status: 'COMPLETED', data: result }),
        'EX',
        ttlSeconds,
      );
      return { result, cached: false };
    } catch (err) {
      // Release lock on unexpected failure to permit retry
      await this.redis.del(redisKey);
      throw err;
    }
  }
}
```

## 2. Integration into NestJS CQRS Command Handler

```typescript
@CommandHandler(ImportFeedCommand)
export class ImportFeedHandler implements ICommandHandler<ImportFeedCommand> {
  constructor(
    private readonly idempotency: IdempotencyGuardHelper,
    private readonly feedImportService: FeedImportService,
  ) {}

  async execute(command: ImportFeedCommand) {
    if (!command.idempotencyKey) {
      return this.feedImportService.startImport(command);
    }

    const { result } = await this.idempotency.handleIdempotency(
      `import-feed:${command.feedId}:${command.idempotencyKey}`,
      () => this.feedImportService.startImport(command),
    );

    return result;
  }
}
```
