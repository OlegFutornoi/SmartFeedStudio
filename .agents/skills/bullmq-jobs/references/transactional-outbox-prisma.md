# Transactional Outbox Pattern with Prisma

## 1. Dual-Write Hazard

If an application executes `await prisma.user.create(...)` followed by `await queue.add(...)`, the system risks inconsistent state when Redis crashes or the worker restarts between these two statements: the entity exists, but the event is permanently lost.
Publishing inside a database transaction risks delivering events to queues when the database transaction later rolls back on commit.

## 2. Solution: PostgreSQL Outbox Table

Record events atomically within the primary business database transaction using an `outbox_events` table:

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

## 3. Atomic Mutation via Prisma `$transaction`

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Mutate business entity
  const feed = await tx.feed.update({
    where: { id: feedId },
    data: { status: 'IMPORTING' },
  });

  // 2. Insert outbox record atomically
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

## 4. Background Outbox Relay Worker

A background scheduler polls pending records at regular intervals:

```typescript
@Injectable()
export class OutboxRelayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedQueue: Queue,
  ) {}

  @Cron('*/2 * * * * *') // Every 2 seconds
  async processOutboxBatch() {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const event of events) {
      try {
        await this.feedQueue.add(event.eventType, event.payload, {
          jobId: `outbox:${event.id}`, // Idempotent job key
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
