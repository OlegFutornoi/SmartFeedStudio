// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ToggleSupplierCategoryCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(ToggleSupplierCategoryCommand)
export class ToggleSupplierCategoryHandler implements ICommandHandler<ToggleSupplierCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ToggleSupplierCategoryCommand) {
    const { supplierId, categoryId, userId, isActive } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const existing = await this.prisma.supplierCategoryRule.findFirst({
      where: {
        supplierId,
        OR: [{ id: categoryId }, { feedCategoryId: categoryId }],
      },
    });

    if (!existing) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const updated = await this.prisma.supplierCategoryRule.update({
      where: { id: existing.id },
      data: { isActive },
    });

    return {
      id: updated.id,
      supplierId: updated.supplierId,
      feedCategoryId: updated.feedCategoryId,
      name: updated.name,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
