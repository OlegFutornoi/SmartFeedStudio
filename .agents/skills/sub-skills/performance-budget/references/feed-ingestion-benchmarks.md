# Feed Ingestion Throughput & Memory Allocation Benchmarks

## 1. Цільові показники швидкодії (KPIs)

| Етап обробки                       | Мінімальна швидкість | Максимум споживання RAM |
| :--------------------------------- | :------------------- | :---------------------- |
| Потоковий SAX-парсинг XML          | ≥ 2,000 SKU / сек    | ≤ 128 МБ                |
| Валідація Zod / DTO                | ≥ 5,000 SKU / сек    | ≤ 64 МБ                 |
| Батчевий upsert у PostgreSQL       | ≥ 500 SKU / сек      | ≤ 256 МБ                |
| Батчевий upsert у SQLCipher SQLite | ≥ 800 SKU / сек      | ≤ 128 МБ                |

## 2. Автоматизований бенчмарк-тест через Vitest

```typescript
import { describe, it, expect } from 'vitest';
import { parseXmlFeedStream } from '@/modules/feeds/parser';
import { createReadStream } from 'node:fs';

describe('Performance Benchmark: XML Ingestion Throughput', () => {
  it('should parse 10,000 items in under 5 seconds (>= 2,000 SKU/s)', async () => {
    const stream = createReadStream('test/fixtures/10k_products_feed.xml');

    const startTime = performance.now();
    let totalParsed = 0;

    await parseXmlFeedStream(stream, 'offer', async (chunk) => {
      totalParsed += chunk.length;
    });

    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const throughput = Math.round(totalParsed / elapsedSeconds);

    console.log(
      `[Benchmark Result]: ${totalParsed} SKU parsed in ${elapsedSeconds.toFixed(2)}s (${throughput} SKU/sec)`,
    );

    expect(totalParsed).toBe(10000);
    expect(throughput).toBeGreaterThanOrEqual(2000);
  });
});
```

## 3. Контроль витоків пам'яті (Memory Baseline Assertion)

```typescript
it('heap usage should remain stable under 100k items stream', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Проганяємо важкий потік
  await runLargeFeedProcessing();

  if (global.gc) global.gc();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryGrowthMb = (finalMemory - initialMemory) / 1024 / 1024;

  console.log(`[Memory Baseline]: Net heap growth: ${memoryGrowthMb.toFixed(2)} MB`);
  // Приріст пам'яті після GC не повинен перевищувати 50 МБ
  expect(memoryGrowthMb).toBeLessThan(50);
});
```
