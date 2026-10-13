import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierCategoryCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(UpdateSupplierCategoryCommand)
export class UpdateSupplierCategoryHandler implements ICommandHandler<UpdateSupplierCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierCategoryCommand) {
    const { supplierId, categoryId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const target = await this.prisma.supplierCategoryRule.findFirst({
      where: {
        supplierId,
        OR: [{ id: categoryId }, { feedCategoryId: categoryId }],
      },
    });
    if (!target) throw new NotFoundException(`Category ${categoryId} not found`);

    const data: Prisma.SupplierCategoryRuleUpdateInput = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.marginPercent !== undefined) data.marginPercent = dto.marginPercent;
    if (dto.fixedMarkup !== undefined) data.fixedMarkup = dto.fixedMarkup;

    const updated = await this.prisma.supplierCategoryRule.update({
      where: { id: target.id },
      data,
    });

    return {
      id: updated.id,
      supplierId: updated.supplierId,
      feedCategoryId: updated.feedCategoryId,
      name: updated.name,
      parentId: updated.parentId,
      isActive: updated.isActive,
      marginPercent: updated.marginPercent !== null ? Number(updated.marginPercent) : null,
      fixedMarkup: updated.fixedMarkup !== null ? Number(updated.fixedMarkup) : null,
      productCount: updated.productCount,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
