# Golden Path: CQRS Single Handler Per File (`ARCH-04`, `CORE-04`)

```ts
// services/backend-api/src/modules/suppliers/queries/get-supplier-sync-logs.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { SupplierSyncLogDto } from '@smartfeed/shared';
import { GetSupplierSyncLogsQuery } from '@/modules/suppliers/queries/suppliers.queries';

@QueryHandler(GetSupplierSyncLogsQuery)
export class GetSupplierSyncLogsHandler implements IQueryHandler<GetSupplierSyncLogsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierSyncLogsQuery): Promise<SupplierSyncLogDto[]> {
    const { supplierId, userId, limit = 50 } = query;
    return this.prisma.supplierSyncLog.findMany({
      where: {
        supplierId,
        supplier: { userId },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
```
