import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import {
  GetSuppliersQuery,
  GetSupplierByIdQuery,
  GetSupplierCategoriesQuery,
  GetSupplierPricingRulesQuery,
} from '@/modules/suppliers/queries/suppliers.queries';
import { NotFoundException } from '@nestjs/common';

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
  }
}

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
