import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetSupplierByIdQuery } from './get-supplier-by-id.query';
import { SupplierDto } from '@smartfeed/shared';

@QueryHandler(GetSupplierByIdQuery)
export class GetSupplierByIdHandler implements IQueryHandler<GetSupplierByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierByIdQuery): Promise<SupplierDto> {
    const { id, userId } = query;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            products: true,
            feedSources: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    return {
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
    };
  }
}
