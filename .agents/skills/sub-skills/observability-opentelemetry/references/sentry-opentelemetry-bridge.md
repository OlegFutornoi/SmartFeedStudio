# Sentry & OpenTelemetry Span Bridging Architecture

## 1. Концепція зв'язування Sentry та OpenTelemetry

Замість паралельного зняття трейсів двома різними бібліотеками, Sentry використовує OpenTelemetry як єдине джерело істини:

- Помилки (exceptions), спіймані NestJS `GlobalHttpExceptionFilter` або Sentry Interceptor, автоматично прив'язуються до активного OpenTelemetry Span.
- Заголовок `sentry-trace` і `traceparent` синхронізовані.

## 2. Інтеграція в GlobalHttpExceptionFilter у NestJS

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { requestContextStorage } from './w3c-trace-context-propagation';
import { logger } from './structured-logging-pino';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const traceCtx = requestContextStorage.getStore();
    const traceId = traceCtx?.traceId || 'unknown';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : 'Internal Server Error';

    // 1. Логуємо структуровану помилку в Pino
    logger.error(
      {
        err: exception,
        status,
        path: request.url,
        method: request.method,
        traceId,
      },
      'HTTP Request Exception',
    );

    // 2. Якщо це 500 або необроблена помилка — відправляємо в Sentry
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('traceId', traceId);
        if (traceCtx?.userId) scope.setUser({ id: traceCtx.userId });
        Sentry.captureException(exception);
      });
    }

    // 3. Повертаємо клієнту чистий DTO з traceId для звернення в підтримку
    response.status(status).json({
      statusCode: status,
      message,
      traceId,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 3. Чеклист для Sentry алертів

- [ ] Кожна 500 помилка повертає клієнту `traceId`.
- [ ] Клієнт показує тост з текстом: «Помилка сервера. ID запиту: [traceId]».
- [ ] У панелі Sentry доступний прямий пошук за цим `traceId`.
