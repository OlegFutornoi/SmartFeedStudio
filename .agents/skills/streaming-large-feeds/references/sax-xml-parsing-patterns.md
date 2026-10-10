# SAX XML Streaming & Backpressure Patterns

## 1. Архітектура подієвого парсингу товарів через `saxes`

Замість побудови DOM-дерева в пам'яті використовується SAX-парсер, який читає потік байти-за-байтом і генерує події:

- `opentag`: виявлення початку `<offer>` або `<item>`
- `text`: читання вмісту елементів (`<price>`, `<name>`, `<vendor>`)
- `closetag`: фіксація завершення товару та додавання в поточний чанк

```typescript
import { SaxesParser } from 'saxes';
import { Readable } from 'node:stream';

export interface StreamItemHandler<T> {
  onItem: (item: T) => Promise<void>;
  chunkSize?: number;
}

export async function parseXmlFeedStream<T>(
  stream: Readable,
  targetTag: string, // наприклад, 'offer' або 'item'
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
          stream.pause(); // Backpressure: призупиняємо потік доки база або черга обробляє чанк
          const chunkToSend = [...itemsBuffer];
          itemsBuffer = [];

          try {
            await onChunk(chunkToSend);
          } catch (err) {
            stream.destroy(err as Error);
            return reject(err);
          } finally {
            isProcessing = false;
            stream.resume(); // Продовжуємо читання потоку
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

## 2. Ключові правила контролю потоку (Backpressure)

1. **`stream.pause()` перед `await onChunk()`**: Якщо обробник чанка асинхронний (запис у Redis/BullMQ або в БД), потік зобов'язаний бути призупинений. Інакше буфер у пам'яті Node.js вибухне при читанні зі швидкого SSD чи мережевого сокета.
2. **`stream.resume()` тільки у блоці `finally`**: Відновлення потоку гарантовано відбувається навіть при успішній обробці або повторних спробах.
3. **Очищення текстових буферів**: `textBuffer = ''` обов'язково скидається після кожного закриття тегу, щоб запобігти склеюванню значень різних товарів.
