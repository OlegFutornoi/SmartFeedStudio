# Structured JSON Logging with Pino & Context Injection

## 1. Конфігурація логера Pino

Pino забезпечує мінімальні накладні витрати на процесор і генерує валідний структурований JSON:

```typescript
import pino from 'pino';
import { requestContextStorage } from './w3c-trace-context-propagation';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      'currentPassword',
      'newPassword',
      'licenseKey',
      'token',
      'refreshToken',
      '*.password',
    ],
    censor: '[REDACTED]',
  },
  mixin() {
    // Автоматично додаємо traceId з поточного асинхронного контексту
    const ctx = requestContextStorage.getStore();
    return {
      traceId: ctx?.traceId,
      spanId: ctx?.spanId,
      userId: ctx?.userId,
      orgId: ctx?.orgId,
    };
  },
});
```

## 2. Формат структурованого логу в продакшені

```json
{
  "level": "info",
  "time": 1728061200000,
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "userId": "usr_cuid123",
  "orgId": "org_cuid456",
  "module": "FeedImportService",
  "msg": "Feed chunk 12 successfully imported",
  "importedItemsCount": 500,
  "durationMs": 420
}
```

## 3. Чеклист структурованого логування

- [ ] Жодних конкатенацій рядків (`logger.info("user: " + user)` -> передавати об'єктом: `logger.info({ user }, "user loaded")`).
- [ ] Обов'язкове маскування паролів та токенів (`redact`).
- [ ] Логи рівня `debug` вимкнені в продакшені.
- [ ] Використовується `mixin()` для уникнення ручного прокидання `traceId` у кожен виклик.
