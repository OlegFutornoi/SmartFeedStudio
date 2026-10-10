---
name: streaming-large-feeds
version: 1.0.0
description: 'Use for parsing and importing high-volume XML/CSV feeds (100k+ SKU): SAX streaming, Node.js stream backpressure, chunked BullMQ ingestion, and memory leak prevention.'
metadata:
  requires:
    packages: ['saxes', 'stream/promises', 'csv-parse', 'bullmq']
---

# streaming-large-feeds

Інженерні стандарти потокового парсингу та імпорту надвеликих каталогів товарів (100,000+ SKU, XML/CSV файли від 100 МБ до кількох ГБ) з нульовим переповненням оперативної пам'яті (OOM).

## Залізні принципи потокового імпорту

1. **Заборона DOM-парсерів у пам'яті**: Заборонено читати весь XML/CSV у пам'ять (`fs.readFileSync`, `xml2js.parseStringPromise` на всьому буфері). Будь-який фід >5 МБ здатний викликати Out-Of-Memory (OOM) на сервері або падіння десктопного вебв'ю.
2. **SAX-парсер з Backpressure**: Використовувати тільки подієві потокові парсери (`saxes` або `csv-parse/stream`) з повною підтримкою backpressure (`stream.pause()` / `stream.resume()`) при наповненні буфера чанка.
3. **Чанкування для черг (Chunked BullMQ Ingestion)**: Великий потік товарів розбивається на атомарні чанки фіксованого розміру (наприклад, по 500–1,000 SKU) та ставиться в чергу BullMQ як серія незалежних підзадач.
4. **Гарантоване закриття стрімів**: Кожен стрім зобов'язаний бути обгорнутий у `pipeline` з `stream/promises` або мати блок `finally` з викликом `.destroy()` при помилках парсингу, щоб уникнути витоків файлових дескрипторів та пам'яті.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                        | Цільовий reference-файл                                                                      | Ключовий фокус                                                           |
| :------------------------------------------------------ | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| Парсинг XML через SAX, витягування `<offer>` / `<item>` | [`references/sax-xml-parsing-patterns.md`](references/sax-xml-parsing-patterns.md)           | Потокове читання тегів, pause/resume при скиданні чанка, безпечний буфер |
| Розбиття великих фідів на задачі черги BullMQ           | [`references/bullmq-chunked-ingestion.md`](references/bullmq-chunked-ingestion.md)           | Батчинг по 500-1000 SKU, прогрес імпорту, parent-child координація робіт |
| Захист від OOM, витоків пам'яті стрімів та GC-тиску     | [`references/memory-leak-and-stream-safety.md`](references/memory-leak-and-stream-safety.md) | `pipeline()`, очищення лісенерів, обробка помилок `error`/`close`/`end`  |

## Категорично заборонено

- Читати весь XML-файл у пам'ять через `fs.readFileSync` чи `buffer.toString()`.
- Ігнорувати backpressure стрімів (накопичувати нескінченний масив об'єктів у замиканні).
- Писати 100,000 товарів в БД одним гігантським SQL-запитом без чанкування.
- Залишати стріми відкритими при виникненні винятків (`stream.destroy()` обов'язковий).
