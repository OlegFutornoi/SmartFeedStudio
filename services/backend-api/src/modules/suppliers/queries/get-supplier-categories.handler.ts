import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
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

    const where: Prisma.SupplierCategoryRuleWhereInput = { supplierId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const list = await this.prisma.supplierCategoryRule.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return list.map((c) => {
      const mappingsRecord: Record<
        string,
        {
          marketplaceCode: string;
          marketplaceCategoryId: string | null;
          externalCategoryId: string;
          externalCategoryName: string;
          commissionPercent: number;
          fixedFee: number;
        }
      > = {};

      if (c.marketplaceCode && c.externalCategoryId) {
        mappingsRecord[c.marketplaceCode] = {
          marketplaceCode: c.marketplaceCode,
          marketplaceCategoryId: null,
          externalCategoryId: c.externalCategoryId,
          externalCategoryName: c.externalCategoryName || '',
          commissionPercent: c.commissionPercent ? Number(c.commissionPercent) : 0,
          fixedFee: 0,
        };
      }

      const cleanFeedCategoryId = c.feedCategoryId.startsWith('scat_')
        ? c.feedCategoryId.split('_')[2] || c.feedCategoryId
        : c.feedCategoryId;
      const cleanName = c.name.startsWith('scat_')
        ? c.externalCategoryName ||
          (cleanFeedCategoryId && !cleanFeedCategoryId.startsWith('scat_')
            ? `Категорія #${cleanFeedCategoryId}`
            : 'Загальна категорія')
        : c.name;

      return {
        id: c.id,
        supplierId: c.supplierId,
        feedCategoryId: cleanFeedCategoryId,
        name: cleanName,
        parentId: c.parentId,
        isActive: c.isActive,
        markupType:
          (c.markupType as 'PERCENT' | 'FIXED') ||
          (c.fixedMarkup !== null && c.marginPercent === null ? 'FIXED' : 'PERCENT'),
        marginPercent: c.marginPercent !== null ? Number(c.marginPercent) : null,
        fixedMarkup: c.fixedMarkup !== null ? Number(c.fixedMarkup) : null,
        commissionPercent: c.commissionPercent !== null ? Number(c.commissionPercent) : null,
        marketplaceCategoryId: null,
        marketplaceCode: c.marketplaceCode,
        externalCategoryId: c.externalCategoryId,
        externalCategoryName: c.externalCategoryName,
        marketplaceMappings: mappingsRecord,
        productCount: c.productCount,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  }
}
