import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierPricingRuleCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(UpdateSupplierPricingRuleCommand)
export class UpdateSupplierPricingRuleHandler implements ICommandHandler<UpdateSupplierPricingRuleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierPricingRuleCommand) {
    const { supplierId, ruleId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const current = await this.prisma.supplierPricingRule.findFirst({
      where: { id: ruleId, supplierId },
    });
    if (!current) throw new NotFoundException(`Rule ${ruleId} not found`);

    const data: Prisma.SupplierPricingRuleUpdateInput = {};
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.minPrice !== undefined) data.minPrice = dto.minPrice;
    if (dto.maxPrice !== undefined) data.maxPrice = dto.maxPrice;
    if (dto.marginPercent !== undefined) data.marginPercent = dto.marginPercent;
    if (dto.fixedMarkup !== undefined) data.fixedMarkup = dto.fixedMarkup;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.supplierPricingRule.update({
      where: { id: ruleId },
      data,
    });

    return {
      id: updated.id,
      supplierId: updated.supplierId,
      categoryId: updated.categoryId,
      minPrice: updated.minPrice !== null ? Number(updated.minPrice) : null,
      maxPrice: updated.maxPrice !== null ? Number(updated.maxPrice) : null,
      marginPercent: Number(updated.marginPercent),
      fixedMarkup: Number(updated.fixedMarkup),
      priority: updated.priority,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
