# Memory Leak Prevention & Stream Safety Guide

## 1. Primary Sources of Memory Leaks in Node.js Streams

1. Uncleared event listeners (`stream.on(...)`): Registering listeners inside loops without removing them via `removeListener` or closing the stream causes memory accumulation in the V8 heap.
2. Dangling streams missing `error` handlers: If a readable stream emits an error and the pipeline lacks an `error` handler, the stream remains open, retaining file descriptors and buffer memory.
3. Giant string concatenation: Concatenating large XML strings without cleaning intermediate chunks applies exponential GC pressure.

## 2. Canonical Stream Pattern via `stream/promises`

Use official Node.js `pipeline` instead of manual event registration:

```typescript
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import { Transform } from 'node:stream';

export async function safelyProcessFileStream(
  filePath: string,
  transformChunk: (chunk: Buffer) => Promise<void>,
) {
  const readStream = createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64 KB chunks

  const processingStream = new Transform({
    async transform(chunk, encoding, callback) {
      try {
        await transformChunk(chunk);
        callback(null, null); // Drop chunk immediately, avoiding buffer accumulation
      } catch (err) {
        callback(err as Error);
      }
    },
  });

  try {
    // pipeline safely destroys all streams upon error
    await pipeline(readStream, processingStream);
  } catch (err) {
    console.error('[StreamSafety] Pipeline failed safely, all streams destroyed:', err);
    throw err;
  }
}
```

## 3. Memory Health Diagnostics

```typescript
export function assertMemoryHealth(thresholdMb = 512): void {
  const usedMb = process.memoryUsage().heapUsed / 1024 / 1024;
  if (usedMb > thresholdMb) {
    if (global.gc) {
      global.gc(); // Force GC in memory benchmarks or critical background jobs
    }
    console.warn(
      `[MemoryAlert] High heap usage detected: ${Math.round(usedMb)} MB (limit: ${thresholdMb} MB)`,
    );
  }
}
```

## 4. Streaming Pre-Flight Checklist

- All streams wrap in `try { await pipeline(...) } catch` or explicit `finally { stream.destroy(); }`.
- Buffer size `highWaterMark` is tuned to object size (default 64 KB, or 16 KB for objectMode streams).
- Zero raw string accumulation in module-level or global variables.
- Temporary files in `/tmp/` are cleaned up in `finally` blocks upon completion or stream abortion.
