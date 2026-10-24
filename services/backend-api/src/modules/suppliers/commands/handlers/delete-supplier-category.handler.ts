// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteSupplierCategoryCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(DeleteSupplierCategoryCommand)
export class DeleteSupplierCategoryHandler implements ICommandHandler<DeleteSupplierCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteSupplierCategoryCommand) {
    const { supplierId, categoryId, userId } = command;

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

    await this.prisma.supplierCategoryRule.delete({
      where: { id: existing.id },
    });

    return {
      success: true,
      id: existing.id,
      feedCategoryId: existing.feedCategoryId,
    };
  }
}
