// @golden - Reference pattern for single-file CQRS Query Handler with tenancy isolation (BE-01, ARCH-04)
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSupplierByIdQuery } from '@/modules/suppliers/queries/suppliers.queries';

@QueryHandler(GetSupplierByIdQuery)
export class GetSupplierByIdHandler implements IQueryHandler<GetSupplierByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierByIdQuery) {
    const { id, userId } = query;

    const s = await this.prisma.supplier.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            categoryRules: true,
            feedSources: true,
          },
        },
        categoryRules: {
          select: { isActive: true },
        },
        feedSources: {
          select: { id: true, productsCount: true },
        },
      },
    });

    if (!s) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    const activeCats = s.categoryRules.filter((c) => c.isActive).length;
    const feedsCount = s.feedSources.length;
    const productsTotal = s.feedSources.reduce((acc, f) => acc + (f.productsCount || 0), 0);

    return {
      id: s.id,
      organizationId: s.organizationId,
      userId: s.userId,
      name: s.name,
      code: s.code,
      contactPhone: s.contactPhone,
      contactEmail: s.contactEmail,
      website: s.website,
      notes: s.notes,
      logoUrl: s.logoUrl,
      legalName: s.legalName,
      taxId: s.taxId,
      industry: s.industry,
      segment: s.segment,
      managerName: s.managerName,
      managerPosition: s.managerPosition,
      managerPhone: s.managerPhone,
      managerEmail: s.managerEmail,
      managerTelegram: s.managerTelegram,
      country: s.country,
      city: s.city,
      address: s.address,
      postcode: s.postcode,
      defaultMarginPercent: Number(s.defaultMarginPercent),
      defaultFixedMarkup: Number(s.defaultFixedMarkup),
      isActive: s.isActive,
      productsCount: productsTotal,
      activeFeedsCount: feedsCount,
      categoriesCount: s._count.categoryRules,
      activeCategoriesCount: activeCats,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
