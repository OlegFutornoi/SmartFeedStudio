# 📦 Feed Data Generators — Генерація XML та CSV фідів для тестів

## 1. Стрімінговий генератор валідного XML каталогу (Rozetka / YML формат)

```typescript
import { createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface FeedGeneratorOptions {
  itemCount: number;
  supplierName?: string;
  currency?: string;
  withCdata?: boolean;
}

export function generateTestXmlFeed(
  filename: string,
  options: FeedGeneratorOptions,
): Promise<string> {
  const filePath = join(tmpdir(), filename);
  const stream = createWriteStream(filePath, { encoding: 'utf-8' });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => resolve(filePath));

    stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    stream.write(`<yml_catalog date="${new Date().toISOString()}">\n`);
    stream.write(`  <shop>\n`);
    stream.write(`    <name>${options.supplierName || 'Test Supplier'}</name>\n`);
    stream.write(`    <company>SmartFeed Test Co</company>\n`);
    stream.write(
      `    <currencies><currency id="${options.currency || 'UAH'}" rate="1"/></currencies>\n`,
    );
    stream.write(`    <categories>\n`);
    stream.write(`      <category id="1">Ноутбуки</category>\n`);
    stream.write(`      <category id="2" parentId="1">Ігрові ноутбуки</category>\n`);
    stream.write(`    </categories>\n`);
    stream.write(`    <offers>\n`);

    for (let i = 1; i <= options.itemCount; i++) {
      const price = (1000 + (i % 500) * 10).toFixed(2);
      const name = options.withCdata
        ? `<![CDATA[Товар #${i} & <спецсимволи>]]>`
        : `Товар #${i} Ноутбук Asus`;

      stream.write(`      <offer id="SKU-${i}" available="true">\n`);
      stream.write(`        <name>${name}</name>\n`);
      stream.write(`        <price>${price}</price>\n`);
      stream.write(`        <currencyId>${options.currency || 'UAH'}</currencyId>\n`);
      stream.write(`        <categoryId>2</categoryId>\n`);
      stream.write(`        <vendor>Asus</vendor>\n`);
      stream.write(`        <vendorCode>ASUS-${i}</vendorCode>\n`);
      stream.write(`        <picture>https://example.com/images/${i}.jpg</picture>\n`);
      stream.write(`      </offer>\n`);
    }

    stream.write(`    </offers>\n`);
    stream.write(`  </shop>\n`);
    stream.write(`</yml_catalog>\n`);
    stream.end();
  });
}
```

---

## 2. CSV генератор з різними роздільниками та спецсимволами

```typescript
export function generateTestCsvFeed(
  filename: string,
  rowCount: number,
  delimiter = ';',
): Promise<string> {
  const filePath = join(tmpdir(), filename);
  const stream = createWriteStream(filePath, { encoding: 'utf-8' });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => resolve(filePath));

    // CSV Header
    stream.write(
      `sku${delimiter}name${delimiter}price${delimiter}category${delimiter}vendor${delimiter}in_stock\n`,
    );

    for (let i = 1; i <= rowCount; i++) {
      const price = (500 + i).toFixed(2);
      // Escape field with quotes if it contains delimiter or quotes
      const name = `"Товар #${i} (з роздільником ${delimiter} та ""лапками"")"`;
      stream.write(
        `SKU-${i}${delimiter}${name}${delimiter}${price}${delimiter}Електроніка${delimiter}Samsung${delimiter}1\n`,
      );
    }

    stream.end();
  });
}
```

---

## 3. Генератор дефектних каталогів (Fuzzing & Fault Injection)

| Тип дефекту        | Що генерується                                           | Очікувана поведінка системи                                                           |
| :----------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **Malformed XML**  | Незакритий тег `<offer>` або обірваний потік на середині | SAX-парсер ловить помилку, фіксує статус `FAILED` у БД, нуль завислих процесів        |
| **Negative Price** | `<price>-150.00</price>`                                 | Валідатор відхиляє конкретний товар, записує у `validationErrors`, решта імпортується |
| **Missing SKU**    | `<offer>` без `id` та без `<vendorCode>`                 | Товар відхиляється як неідентифікований, підраховується у лічильнику `skippedItems`   |
| **Encoding issue** | Windows-1251 або CP1251 без правильного заголовка        | Детекція кодування або коректна локалізована помилка в UI                             |
