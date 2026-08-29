import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ProductCategorySummaryDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetCategoriesSummaryQuery } from './get-categories-summary.query';

@Injectable()
@QueryHandler(GetCategoriesSummaryQuery)
export class GetCategoriesSummaryHandler implements IQueryHandler<
  GetCategoriesSummaryQuery,
  ProductCategorySummaryDto[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCategoriesSummaryQuery): Promise<ProductCategorySummaryDto[]> {
    const { userId } = query;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMemberships: { take: 1, orderBy: { joinedAt: 'desc' } },
      },
    });
    const organizationId = user?.organizationMemberships?.[0]?.organizationId || null;
    const userScope = organizationId ? { OR: [{ organizationId }, { userId }] } : { userId };

    const categories = await this.prisma.productCategory.findMany({
      where: { catalog: userScope },
      orderBy: { nameUk: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          take: 1,
          select: {
            supplier: {
              select: { name: true },
            },
          },
        },
      },
    });

    const result: ProductCategorySummaryDto[] = categories
      .filter((cat) => cat._count.products > 0)
      .map((cat) => ({
        id: cat.id,
        nameUk: cat.nameUk,
        nameEn: cat.nameEn || cat.nameUk,
        productCount: cat._count.products,
        supplierName: cat.products[0]?.supplier?.name || undefined,
      }));

    const uncategorizedCount = await this.prisma.product.count({
      where: {
        catalog: userScope,
        categoryId: null,
      },
    });

    if (uncategorizedCount > 0) {
      result.unshift({
        id: 'uncategorized',
        nameUk: 'Без категорії',
        nameEn: 'Uncategorized',
        productCount: uncategorizedCount,
      });
    }

    return result;
  }
}
