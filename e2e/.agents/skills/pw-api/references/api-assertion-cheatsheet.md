# API Assertion & Contract Testing Cheatsheet

Короткий довідник практик перевірки статус-кодів, контрактів запитів та відповідей, бізнес-правил та асинхронного опитування станів.

---

## 1. Обов'язкова перевірка HTTP статус-кодів

Будь-який тест зобов'язаний починати валідацію зі статусу:

```typescript
// Позитивні запити
expect(response.status, 'Запит повинен повернути 200 OK').toBe(200);
// або для створення ресурсу:
expect(response.status, 'Ресурс повинен бути створений').toBe(201);

// Негативні запити
expect(response.status, 'Повинна бути помилка валідації 400').toBe(400);
// або для семантичних помилок бізнес-логіки:
expect(response.status, 'Сутність не підлягає обробці').toBe(422);
expect(response.status, 'Конфлікт стану State Machine').toBe(409);
```

---

## 2. Валідація контрактів через AJV JSON Schema

У проекті використовується утиліта `validateWithSchema` з `utils/validation.utils.ts`.

### 2.1. Валідація відповіді (Response Contract)

```typescript
import { expect } from '@playwright/test';
import { validateWithSchema } from '@/utils/validation.utils';

// 1. Перевірка статусу
expect(response.status).toBe(200);

// 2. Перевірка схеми відповіді сервера
const schemaResult = await validateWithSchema(response.body, 'api/schemas/lead.schema.json');
expect(
  schemaResult.valid,
  `Порушення контракту схеми: ${JSON.stringify(schemaResult.errors, null, 2)}`,
).toBeTruthy();
```

### 2.2. Валідація вихідного запиту (Request Schema)

Перед відправкою складного payload клієнтського білдера можна перевірити, що він відповідає схемі запиту:

```typescript
const payload = leadBuilder.build();
const requestSchemaResult = await validateWithSchema(
  payload,
  'api/schemas/lead-request.schema.json',
);
expect(
  requestSchemaResult.valid,
  `Невалідний payload запиту: ${JSON.stringify(requestSchemaResult.errors)}`,
).toBeTruthy();

const response = await api.ibpm.lead.createLead(payload);
```

> **Порада:** Якщо схеми немає в `api/schemas/`, скористайтеся утилітою автогенерації:
> `node .agents/skills/pw-api/scripts/generate-json-schema.js sample.json api/schemas/my-schema.json --title="Lead"`

---

## 3. Асинхронне опитування статусів (`expect.poll`)

Заборонено використовувати `waitForTimeout` чи `setTimeout`. Використовуйте `expect.poll` з явними інтервалами та тайм-аутами:

```typescript
await expect
  .poll(
    async () => {
      const status = await api.ibpm.response.getStatusLead(submitRequestId);
      return status.data.leadState;
    },
    {
      message: `Очікувався перехід ліда у статус '${expectedState}', але статус не змінився`,
      timeout: 45_000,
      intervals: [1_000, 2_000, 3_000, 5_000],
    },
  )
  .toBe(expectedState);
```

---

## 4. Звірка збережених даних (Data Parity Assertions)

Не обмежуйтеся перевіркою `status === 200`. Завжди отримуйте актуальний стан сутності та перевіряйте відповідність збережених полів тому, що відправлялося:

```typescript
const savedLead = await api.ibpm.lead.getLead(leadId, sessionId);

// 1. Звірка персональних даних
expect(savedLead.data?.leadInfo?.customer?.taxId).toBe(expectedTaxId);
expect(savedLead.data?.leadInfo?.customer?.phoneNumber).toBe(expectedPhone);

// 2. Звірка авто
expect(savedLead.data?.leadInfo?.vehicle?.engineVolume).toBe(expectedEngineVolume);
expect(savedLead.data?.leadInfo?.vehicle?.driversAgeMin).toBe(expectedDriversAgeMin);

// 3. Звірка фінансових параметрів
const tariffPayment = savedLead.data?.leadInfo?.tariff?.payments?.appliedPayment;
expect(tariffPayment).toBe(expectedTariffPrice);
```

---

## 5. Перевірка помилок API (Negative Assertions)

При негативних тестах обов'язково перевіряйте як HTTP статус-код, так і тіло помилки:

```typescript
// 1. Перевірка коду відповіді
expect(response.status).toBe(400);

// 2. Перевірка структури та коду бізнес-помилки
expect(response.body?.code).toBe('VALIDATION_ERROR');
expect(response.body?.errorDetails).toContainEqual(
  expect.objectContaining({
    field: 'taxId',
    message: expect.stringMatching(/невалідний іпн|invalid tax id/i),
  }),
);
```
