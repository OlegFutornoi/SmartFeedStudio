import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSupplierSyncLogsQuery } from '@/modules/suppliers/queries/suppliers.queries';

@QueryHandler(GetSupplierSyncLogsQuery)
export class GetSupplierSyncLogsHandler implements IQueryHandler<GetSupplierSyncLogsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierSyncLogsQuery) {
    const { supplierId, userId, limit = 50 } = query;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    return this.prisma.supplierSyncLog.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
