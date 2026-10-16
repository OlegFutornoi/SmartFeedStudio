import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSupplierCategoriesQuery } from '@/modules/suppliers/queries/suppliers.queries';

@QueryHandler(GetSupplierCategoriesQuery)
export class GetSupplierCategoriesHandler implements IQueryHandler<GetSupplierCategoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierCategoriesQuery) {
    const { supplierId, userId, search } = query;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const where: Record<string, unknown> = { supplierId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const list = await this.prisma.supplierCategoryRule.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return list.map((c) => ({
      id: c.id,
      supplierId: c.supplierId,
      feedCategoryId: c.feedCategoryId,
      name: c.name,
      parentId: c.parentId,
      isActive: c.isActive,
      marginPercent: c.marginPercent !== null ? Number(c.marginPercent) : null,
      fixedMarkup: c.fixedMarkup !== null ? Number(c.fixedMarkup) : null,
      productCount: c.productCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }
}
