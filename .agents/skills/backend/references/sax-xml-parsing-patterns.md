# SAX XML Streaming & Backpressure Patterns

## 1. Event-Driven Item Parsing Architecture via `saxes`

Instead of loading the complete DOM tree into memory, use a streaming SAX parser to process elements byte-by-byte:

- `opentag`: detect start of `<offer>` or `<item>`
- `text`: capture element content (`<price>`, `<name>`, `<vendor>`)
- `closetag`: commit item entity and enqueue into current chunk

```typescript
import { SaxesParser } from 'saxes';
import { Readable } from 'node:stream';

export interface StreamItemHandler<T> {
  onItem: (item: T) => Promise<void>;
  chunkSize?: number;
}

export async function parseXmlFeedStream<T>(
  stream: Readable,
  targetTag: string, // e.g., 'offer' or 'item'
  onChunk: (items: T[]) => Promise<void>,
  chunkSize = 500,
): Promise<{ totalItems: number }> {
  return new Promise((resolve, reject) => {
    const parser = new SaxesParser();
    let currentTag = '';
    let currentItem: Record<string, string> | null = null;
    let textBuffer = '';
    let itemsBuffer: T[] = [];
    let totalItems = 0;
    let isProcessing = false;

    parser.on('opentag', (node) => {
      currentTag = node.name;
      if (node.name === targetTag) {
        currentItem = { ...node.attributes };
      }
    });

    parser.on('text', (text) => {
      if (currentItem && currentTag) {
        textBuffer += text;
      }
    });

    parser.on('closetag', async (node) => {
      if (currentItem && node.name !== targetTag) {
        currentItem[node.name] = textBuffer.trim();
        textBuffer = '';
      } else if (node.name === targetTag && currentItem) {
        itemsBuffer.push(currentItem as unknown as T);
        totalItems++;
        currentItem = null;
        textBuffer = '';

        if (itemsBuffer.length >= chunkSize && !isProcessing) {
          isProcessing = true;
          stream.pause(); // Backpressure: pause stream while chunk is processed
          const chunkToSend = [...itemsBuffer];
          itemsBuffer = [];

          try {
            await onChunk(chunkToSend);
          } catch (err) {
            stream.destroy(err as Error);
            return reject(err);
          } finally {
            isProcessing = false;
            stream.resume(); // Resume stream processing
          }
        }
      }
    });

    parser.on('error', (err) => {
      stream.destroy(err);
      reject(err);
    });

    parser.on('end', async () => {
      if (itemsBuffer.length > 0) {
        try {
          await onChunk(itemsBuffer);
        } catch (err) {
          return reject(err);
        }
      }
      resolve({ totalItems });
    });

    stream.on('data', (chunk) => {
      try {
        parser.write(chunk.toString());
      } catch (err) {
        stream.destroy(err as Error);
        reject(err);
      }
    });

    stream.on('end', () => parser.close());
    stream.on('error', (err) => reject(err));
  });
}
```

## 2. Core Backpressure Rules

1. `stream.pause()` before `await onChunk()`: When processing chunks asynchronously (DB upsert, Redis, BullMQ), the readable stream must be paused. Otherwise Node.js in-memory buffers overflow on fast storage.
2. `stream.resume()` strictly in `finally` block: Resumption must be guaranteed regardless of chunk processing outcomes.
3. Text buffer reset: `textBuffer = ''` must be cleared after closing each tag to avoid cross-contaminating entity attributes.
