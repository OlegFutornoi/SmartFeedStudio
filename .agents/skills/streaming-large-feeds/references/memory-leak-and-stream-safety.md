# Memory Leak Prevention & Stream Safety Guide

## 1. Головні джерела витоків пам'яті в Node.js стрімах

1. **Неприбрані слухачі подій (`stream.on(...)`)**: Якщо реєструвати слухачі всередині циклів без подальшого відписування через `removeListener` або закриття стріму, процес Node.js накопичуватиме витік пам'яті в V8 heap.
2. **Завислі стріми без обробника `error`**: Якщо потік читання кидає помилку, а пайплайн не перехоплює подію `error`, стрім зависає у відкритому стані, утримуючи файловий дескриптор і системний буфер.
3. **Буферизація великих рядків (`string concatenation`)**: Конкатенація гігантських XML рядків без очищення фрагментів створює експоненційний тиск на Garbage Collector (GC pauses).

## 2. Канонічний паттерн безпечного стрімінгу через `stream/promises`

Замість ручного підключення подій використовуйте офіційний `pipeline`:

```typescript
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import { Transform } from 'node:stream';

export async function safelyProcessFileStream(
  filePath: string,
  transformChunk: (chunk: Buffer) => Promise<void>,
) {
  const readStream = createReadStream(filePath, { highWaterMark: 64 * 1024 }); // Читання блоками по 64 КБ

  const processingStream = new Transform({
    async transform(chunk, encoding, callback) {
      try {
        await transformChunk(chunk);
        callback(null, null); // Скидаємо чанк, не накопичуючи результат у вихідному буфері
      } catch (err) {
        callback(err as Error);
      }
    },
  });

  try {
    // pipeline автоматично коректно знищує всі потоки при будь-якій помилці
    await pipeline(readStream, processingStream);
  } catch (err) {
    console.error('[StreamSafety] Pipeline failed safely, all streams destroyed:', err);
    throw err;
  }
}
```

## 3. Правила перевірки пам'яті під час стрімінгу (Memory Diagnostics)

```typescript
export function assertMemoryHealth(thresholdMb = 512): void {
  const usedMb = process.memoryUsage().heapUsed / 1024 / 1024;
  if (usedMb > thresholdMb) {
    if (global.gc) {
      global.gc(); // Форсований GC в тестах або критичних фонових задачах
    }
    console.warn(
      `[MemoryAlert] High heap usage detected: ${Math.round(usedMb)} MB (limit: ${thresholdMb} MB)`,
    );
  }
}
```

## 4. Чеклист перед здачею потокового коду

- [ ] Всі стріми мають `try { await pipeline(...) } catch` або явний `finally { stream.destroy(); }`.
- [ ] Розмір буфера `highWaterMark` налаштовано відповідно до розміру об'єктів (за замовчуванням 64 КБ або 16 КБ для об'єктних стрімів).
- [ ] Відсутнє накопичення сирих рядків у глобальних або модульних змінних.
- [ ] Очищення проміжних файлів у `/tmp/` після завершення або аварійного розриву стріму.
