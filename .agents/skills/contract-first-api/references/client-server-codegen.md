# Client-Server Integration — Інтеграція контрактів на клієнті та сервері

## 1. Використання на сервері (NestJS)

DTO у контролері наслідує або валідується через спільний контракт:

```typescript
import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ImportFeedDto, ImportFeedSchema } from '@smartfeed/shared';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

@Controller('feeds')
export class FeedsController {
  @Post('import')
  @UsePipes(new ZodValidationPipe(ImportFeedSchema))
  async importFeed(@Body() dto: ImportFeedDto) {
    return this.commandBus.execute(new ImportFeedCommand(dto));
  }
}
```

## 2. Використання на клієнті (Desktop / Admin)

Клієнтський API сервіс строго типізований через DTO з `@smartfeed/shared`:

```typescript
import type { ImportFeedDto, ImportFeedResponseDto } from '@smartfeed/shared';
import { apiClient } from '@/services/api/client';

export const feedsApi = {
  importFeed: async (payload: ImportFeedDto): Promise<ImportFeedResponseDto> => {
    return apiClient.post<ImportFeedResponseDto>('/feeds/import', payload);
  },
};
```

Це гарантує: зміна поля на бекенді викликає помилку компіляції (`tsc --noEmit`) на клієнті, запобігаючи багам у рантаймі.
