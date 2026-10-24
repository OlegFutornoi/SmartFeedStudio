// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BulkUpsertSupplierCategoriesCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(BulkUpsertSupplierCategoriesCommand)
export class BulkUpsertSupplierCategoriesHandler implements ICommandHandler<BulkUpsertSupplierCategoriesCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: BulkUpsertSupplierCategoriesCommand) {
    const { supplierId, userId, categories } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const upserted = [];
      for (const c of categories) {
        const item = await tx.supplierCategoryRule.upsert({
          where: {
            supplierId_feedCategoryId: {
              supplierId,
              feedCategoryId: c.feedCategoryId,
            },
          },
          create: {
            supplierId,
            feedCategoryId: c.feedCategoryId,
            name: c.name,
            parentId: c.parentId ?? null,
            feedSourceId: c.feedSourceId ?? null,
            feedName: c.feedName ?? null,
            productCount: c.productCount ?? 0,
            isActive: c.isActive ?? true,
            markupType: 'PERCENT',
          },
          update: {
            name: c.name,
            ...(c.parentId !== undefined ? { parentId: c.parentId } : {}),
            ...(c.feedSourceId !== undefined ? { feedSourceId: c.feedSourceId } : {}),
            ...(c.feedName !== undefined ? { feedName: c.feedName } : {}),
            ...(c.productCount !== undefined ? { productCount: c.productCount } : {}),
            ...(c.isActive !== undefined ? { isActive: c.isActive } : {}),
          },
        });
        upserted.push(item);
      }
      return upserted;
    });

    return results.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      feedCategoryId: r.feedCategoryId,
      name: r.name,
      parentId: r.parentId,
      isActive: r.isActive,
      feedSourceId: r.feedSourceId,
      feedName: r.feedName,
      productCount: r.productCount,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
}
