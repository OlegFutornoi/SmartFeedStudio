import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupplierPricingRuleCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(CreateSupplierPricingRuleCommand)
export class CreateSupplierPricingRuleHandler implements ICommandHandler<CreateSupplierPricingRuleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSupplierPricingRuleCommand) {
    const { supplierId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const created = await this.prisma.supplierPricingRule.create({
      data: {
        supplierId,
        categoryId: dto.categoryId,
        minPrice: dto.minPrice ?? 0,
        maxPrice: dto.maxPrice ?? null,
        marginPercent: dto.marginPercent ?? 0,
        fixedMarkup: dto.fixedMarkup ?? 0,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      id: created.id,
      supplierId: created.supplierId,
      categoryId: created.categoryId,
      minPrice: created.minPrice !== null ? Number(created.minPrice) : null,
      maxPrice: created.maxPrice !== null ? Number(created.maxPrice) : null,
      marginPercent: Number(created.marginPercent),
      fixedMarkup: Number(created.fixedMarkup),
      priority: created.priority,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
