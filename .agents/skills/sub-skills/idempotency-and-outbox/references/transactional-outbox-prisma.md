# Transactional Outbox Pattern with Prisma

## 1. Проблема подвійного запису (Dual-Write Hazard)

Якщо сервіс спочатку робить `await prisma.user.create(...)`, а потім `await queue.add(...)`, система опиняється в некоректному стані при падінні Redis або перезапуску процесу між цими рядками: користувач створений, але подія втрачена.
Якщо публікувати подію всередині транзакції БД, а транзакція впаде на етапі `commit`, черга отримає повідомлення про сутність, якої немає в БД.

## 2. Рішення: Outbox Таблиця в PostgreSQL

Усі події записуються в ту саму транзакцію БД у спеціальну таблицю `outbox_events`:

```prisma
model OutboxEvent {
  id            String    @id @default(cuid())
  aggregateType String    @map("aggregate_type") // e.g., 'Feed', 'User', 'License'
  aggregateId   String    @map("aggregate_id")
  eventType     String    @map("event_type")     // e.g., 'FeedImportRequested'
  payload       Json
  status        String    @default("PENDING")    // 'PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED'
  retryCount    Int       @default(0)            @map("retry_count")
  lastError     String?   @map("last_error")
  createdAt     DateTime  @default(now())        @map("created_at")
  publishedAt   DateTime? @map("published_at")

  @@index([status, createdAt])
  @@map("outbox_events")
}
```

## 3. Атомарний запис через Prisma `$transaction`

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Зміна бізнес-сутності
  const feed = await tx.feed.update({
    where: { id: feedId },
    data: { status: 'IMPORTING' },
  });

  // 2. Запис події в Outbox
  await tx.outboxEvent.create({
    data: {
      aggregateType: 'Feed',
      aggregateId: feed.id,
      eventType: 'FeedImportStarted',
      payload: {
        feedId: feed.id,
        supplierId: feed.supplierId,
        url: feed.url,
      },
    },
  });

  return feed;
});
```

## 4. Фоновий Outbox Relay Worker

Фоновий процес (наприклад, кожні 1-2 секунди або за тригером) забирає пачку записів `PENDING`:

```typescript
@Injectable()
export class OutboxRelayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedQueue: Queue,
  ) {}

  @Cron('*/2 * * * * *') // кожні 2 секунди
  async processOutboxBatch() {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const event of events) {
      try {
        await this.feedQueue.add(event.eventType, event.payload, {
          jobId: `outbox:${event.id}`, // Ідемпотентний ідентифікатор задачі
        });

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
      } catch (err: any) {
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retryCount: { increment: 1 },
            lastError: err.message,
            status: event.retryCount >= 5 ? 'FAILED' : 'PENDING',
          },
        });
      }
    }
  }
}
```
