// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BatchToggleSupplierCategoriesCommand } from '@/modules/suppliers/commands/suppliers.commands';
import { getSupplierTenancyWhere } from '@/modules/suppliers/utils/supplier-tenancy.util';

@CommandHandler(BatchToggleSupplierCategoriesCommand)
export class BatchToggleSupplierCategoriesHandler implements ICommandHandler<BatchToggleSupplierCategoriesCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: BatchToggleSupplierCategoriesCommand) {
    const { supplierId, userId, categoryIds, isActive } = command;

    const tenancyWhere = await getSupplierTenancyWhere(this.prisma, userId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, ...tenancyWhere },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const whereClause: {
      supplierId: string;
      OR?: Array<{ id?: { in: string[] }; feedCategoryId?: { in: string[] } }>;
    } = {
      supplierId,
    };

    if (categoryIds && categoryIds.length > 0) {
      whereClause.OR = [{ id: { in: categoryIds } }, { feedCategoryId: { in: categoryIds } }];
    }

    const res = await this.prisma.supplierCategoryRule.updateMany({
      where: whereClause,
      data: { isActive },
    });

    return {
      success: true,
      updatedCount: res.count,
    };
  }
}
