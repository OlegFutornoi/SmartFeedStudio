# Zod Shared Patterns

## 1. Directory Structure in `packages/shared/src/`

- `contracts/<domain>/<action>.schema.ts`: Zod validation schema.
- `contracts/<domain>/<action>.dto.ts`: Inferred TypeScript type (`z.infer<typeof ...>`).
- `enums/`: Canonical domain enums (roles, statuses, subscription plans).

## 2. Standard Zod Contract Pattern

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

## 3. Contract Compilation

After modifying contracts in `@smartfeed/shared`, build the package:

```bash
pnpm --filter @smartfeed/shared build
```
