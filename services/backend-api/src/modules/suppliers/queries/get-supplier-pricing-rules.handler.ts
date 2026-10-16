// @golden - Reference pattern for single-file CQRS Query Handler with parent tenancy check (BE-01, ARCH-04)
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSupplierPricingRulesQuery } from '@/modules/suppliers/queries/suppliers.queries';

@QueryHandler(GetSupplierPricingRulesQuery)
export class GetSupplierPricingRulesHandler implements IQueryHandler<GetSupplierPricingRulesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierPricingRulesQuery) {
    const { supplierId, userId } = query;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const list = await this.prisma.supplierPricingRule.findMany({
      where: { supplierId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });

    return list.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      categoryId: r.categoryId,
      categoryNameUk: r.categoryNameUk,
      categoryNameEn: r.categoryNameEn,
      minPrice: r.minPrice !== null ? Number(r.minPrice) : null,
      maxPrice: r.maxPrice !== null ? Number(r.maxPrice) : null,
      marginPercent: Number(r.marginPercent),
      fixedMarkup: Number(r.fixedMarkup),
      priority: r.priority,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
}
