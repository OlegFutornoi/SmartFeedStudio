# Zod Shared Patterns — Опис схем у packages/shared

## 1. Структура файлів у `packages/shared/src/`

- `contracts/<domain>/<action>.schema.ts` — Zod схема валідації.
- `contracts/<domain>/<action>.dto.ts` — виведений TypeScript тип (`z.infer<typeof ...>`).
- `enums/` — єдині доменні перелічення (ролі, статуси, тарифні плани).

## 2. Еталонний патерн Zod схеми

```typescript
import { z } from 'zod';

export const ImportFeedSchema = z.object({
  url: z.string().url('Invalid feed URL').max(2048),
  supplierId: z.string().cuid('Invalid supplier ID'),
  format: z.enum(['XML_YML', 'CSV_STANDART', 'WEBSKLAD']),
  refreshIntervalHours: z.number().int().min(1).max(168).default(24),
  mappingConfig: z.record(z.string(), z.string()).optional(),
});

export type ImportFeedDto = z.infer<typeof ImportFeedSchema>;

export const ImportFeedResponseSchema = z.object({
  feedId: z.string().cuid(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  importedProductsCount: z.number().int().nonnegative(),
});

export type ImportFeedResponseDto = z.infer<typeof ImportFeedResponseSchema>;
```

## 3. Збірка контрактів

Після будь-якого редагування схеми обов'язково виконати:

```bash
pnpm --filter @smartfeed/shared build
```
