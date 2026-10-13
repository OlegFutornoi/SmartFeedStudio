import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateSupplierPricingRuleCommand,
  UpdateSupplierPricingRuleCommand,
  DeleteSupplierPricingRuleCommand,
} from '@/modules/suppliers/commands/suppliers.commands';

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

@CommandHandler(DeleteSupplierPricingRuleCommand)
export class DeleteSupplierPricingRuleHandler implements ICommandHandler<DeleteSupplierPricingRuleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteSupplierPricingRuleCommand) {
    const { supplierId, ruleId, userId } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const current = await this.prisma.supplierPricingRule.findFirst({
      where: { id: ruleId, supplierId },
    });
    if (!current) throw new NotFoundException(`Rule ${ruleId} not found`);

    await this.prisma.supplierPricingRule.delete({
      where: { id: ruleId },
    });

    return { success: true };
  }
}
