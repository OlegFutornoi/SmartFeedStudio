# Chunked Data Backfill Scripts & Migration Safety

## 1. Чому `UPDATE table SET new_col = old_col` вбиває продакшен

Один запит `UPDATE` на 500,000 рядків:

- Блокує всі оновлювані рядки до кінця транзакції.
- Генерує гігантський обсяг WAL логів (Write-Ahead Log), створюючи лавину реплікації (replication lag).
- Надовго завантажує процесор та диск, сповільнюючи нормальні запити користувачів.

## 2. Канонічний патерн чанкованого бекфілу через курсор

Завжди оновлюйте дані пачками фіксованого розміру (наприклад, по 1000 записів), рухаючись за первинним ключем (ID) або індексованим полем:

```typescript
import { PrismaClient } from '@prisma/client';

export async function backfillProductsStatus(
  prisma: PrismaClient,
  batchSize = 1000,
  delayBetweenBatchesMs = 100,
) {
  let lastId = '';
  let processedTotal = 0;

  console.log('[Backfill] Початок фонового бекфілу...');

  while (true) {
    // 1. Вибираємо пачку записів за курсором
    const batch = await prisma.product.findMany({
      where: {
        id: { gt: lastId },
        statusV2: null, // Оновлюємо лише ті, де нове поле ще порожнє
      },
      select: { id: true, legacyStatus: true },
      take: batchSize,
      orderBy: { id: 'asc' },
    });

    if (batch.length === 0) {
      console.log(`[Backfill] Успішно завершено! Всього оновлено: ${processedTotal} рядків.`);
      break;
    }

    // 2. Оновлюємо атомарно поточний чанк
    const ids = batch.map((item) => item.id);
    await prisma.$executeRaw`
      UPDATE products
      SET status_v2 = legacy_status
      WHERE id = ANY(${ids}::text[])
    `;

    processedTotal += batch.length;
    lastId = batch[batch.length - 1].id;
    console.log(`[Backfill] Оброблено ${processedTotal} рядків (останній ID: ${lastId})`);

    // 3. Пауза для зняття тиску з диска та реплікації
    if (delayBetweenBatchesMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs));
    }
  }
}
```

## 3. Моніторинг здоров'я БД під час бекфілу

1. **Replication Lag**: Якщо лаг реплікації перевищує 5 секунд — скрипт автоматично збільшує затримку `delayBetweenBatchesMs`.
2. **Deadlocks**: При виникненні `DeadlockDetected` — повторити поточний чанк через 1 секунду.
3. **Ідемпотентність**: Скрипт можна зупинити і запустити повторно в будь-який момент без дублювання змін.
