import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetSuppliersQuery } from './get-suppliers.query';
import { SupplierDto } from '@smartfeed/shared';

@QueryHandler(GetSuppliersQuery)
export class GetSuppliersHandler implements IQueryHandler<GetSuppliersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSuppliersQuery): Promise<SupplierDto[]> {
    const { userId, search, isActive } = query;

    const where: any = { userId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const suppliers = await this.prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
            feedSources: true,
          },
        },
      },
    });

    return suppliers.map((supplier) => ({
      id: supplier.id,
      organizationId: supplier.organizationId,
      userId: supplier.userId,
      name: supplier.name,
      code: supplier.code,
      contactPhone: supplier.contactPhone,
      contactEmail: supplier.contactEmail,
      website: supplier.website,
      notes: supplier.notes,
      defaultMarginPercent: Number(supplier.defaultMarginPercent),
      defaultFixedMarkup: Number(supplier.defaultFixedMarkup),
      isActive: supplier.isActive,
      productsCount: supplier._count.products,
      activeFeedsCount: supplier._count.feedSources,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    }));
  }
}
