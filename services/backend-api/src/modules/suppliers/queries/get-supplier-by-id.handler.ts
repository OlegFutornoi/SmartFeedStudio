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
          },
        },
        categoryRules: {
          select: { isActive: true },
        },
      },
    });

    if (!s) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    const activeCats = s.categoryRules.filter((c) => c.isActive).length;

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
      baseCurrency: s.baseCurrency,
      targetCurrency: s.targetCurrency,
      exchangeRateMode: s.exchangeRateMode,
      exchangeRate: Number(s.exchangeRate),
      currencyBufferPercent: Number(s.currencyBufferPercent),
      priceRounding: s.priceRounding,
      customRoundingRules: Array.isArray(s.customRoundingRules) ? s.customRoundingRules : [],
      defaultMarginPercent: Number(s.defaultMarginPercent),
      defaultFixedMarkup: Number(s.defaultFixedMarkup),
      isActive: s.isActive,
      productsCount: 0,
      activeFeedsCount: 0,
      categoriesCount: s._count.categoryRules,
      activeCategoriesCount: activeCats,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
