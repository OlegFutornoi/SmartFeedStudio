import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSuppliersQuery } from '@/modules/suppliers/queries/suppliers.queries';

@QueryHandler(GetSuppliersQuery)
export class GetSuppliersHandler implements IQueryHandler<GetSuppliersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSuppliersQuery) {
    const { userId, search } = query;

    const where: Record<string, unknown> = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await this.prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return suppliers.map((s) => {
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
    });
  }
}
