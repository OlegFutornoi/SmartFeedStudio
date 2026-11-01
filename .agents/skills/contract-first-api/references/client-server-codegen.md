# Client-Server Contract Integration

## 1. Backend Server Usage (NestJS)

DTOs in NestJS controllers inherit or validate against shared contracts:

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

## 2. Frontend Client Usage (Desktop / Admin)

Client API services are strictly typed via DTOs from `@smartfeed/shared`:

```typescript
import type { ImportFeedDto, ImportFeedResponseDto } from '@smartfeed/shared';
import { apiClient } from '@/services/api/client';

export const feedsApi = {
  importFeed: async (payload: ImportFeedDto): Promise<ImportFeedResponseDto> => {
    return apiClient.post<ImportFeedResponseDto>('/feeds/import', payload);
  },
};
```

This guarantees that contract changes on the backend immediately trigger compile-time errors (`tsc --noEmit`) in client projects, preventing runtime regressions.
