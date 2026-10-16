# Golden Path: Controller with Validated Query DTO (`BE-01`, `BE-02`)

```ts
// services/backend-api/src/modules/suppliers/dto/supplier-sync.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetSupplierSyncLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

// services/backend-api/src/modules/suppliers/suppliers.controller.ts
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/sync-logs')
  async getSyncLogs(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Query() query: GetSupplierSyncLogsQueryDto,
  ): Promise<SupplierSyncLogDto[]> {
    return this.queryBus.execute(new GetSupplierSyncLogsQuery(supplierId, user.id, query.limit));
  }
}
```
