# Idempotency Keys & CQRS Commands Architecture

## 1. Патерн двофазної ідемпотентності через Redis

Коли користувач відправляє чутливу мутацію (наприклад, `POST /api/feeds/:id/import` або оновлення ліцензії), клієнт передає заголовок:
`X-Idempotency-Key: <uuid-v4>`

Етапи обробки:

1. **Acquire Lock**: Захоплення ключа через Redis `SET key "PROCESSING" NX EX 120`.
   - Якщо ключ вже існує зі значенням `"PROCESSING"` → повертаємо `409 Conflict` (запит ще виконується).
   - Якщо ключ існує зі значенням результату → повертаємо закешовану відповідь `200 OK` або `201 Created` без повторного виконання.
2. **Execute Command**: Виконання CQRS команди через CommandBus.
3. **Save Result**: Запис результату операції в Redis `SET key <json-result> EX 86400` (TTL 24 години).

```typescript
import { Injectable, NestMiddleware, ConflictException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
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

    // Спроба встановити статус PROCESSING
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
            'Запит з таким Idempotency-Key вже обробляється. Зачекайте завершення.',
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
      // При помилці знімаємо блокування, щоб клієнт міг спробувати знову
      await this.redis.del(redisKey);
      throw err;
    }
  }
}
```

## 2. Інтеграція в NestJS CQRS Command Handler

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
