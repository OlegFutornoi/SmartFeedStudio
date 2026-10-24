// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BulkCreateSupplierPricingRulesCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(BulkCreateSupplierPricingRulesCommand)
export class BulkCreateSupplierPricingRulesHandler implements ICommandHandler<BulkCreateSupplierPricingRulesCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: BulkCreateSupplierPricingRulesCommand) {
    const { supplierId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.replaceExisting) {
        await tx.supplierPricingRule.deleteMany({
          where: { supplierId },
        });
      }

      const results = [];
      for (const r of dto.rules) {
        const item = await tx.supplierPricingRule.create({
          data: {
            supplierId,
            categoryId: r.categoryId,
            categoryNameUk: r.categoryNameUk,
            minPrice: r.minPrice ?? null,
            maxPrice: r.maxPrice ?? null,
            marginPercent: r.marginPercent ?? 0,
            fixedMarkup: r.fixedMarkup ?? 0,
            priority: r.priority ?? 0,
            isActive: r.isActive ?? true,
          },
        });
        results.push(item);
      }
      return results;
    });

    return created.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      categoryId: r.categoryId,
      categoryNameUk: r.categoryNameUk,
      minPrice: r.minPrice !== null ? Number(r.minPrice) : null,
      maxPrice: r.maxPrice !== null ? Number(r.maxPrice) : null,
      marginPercent: Number(r.marginPercent),
      fixedMarkup: Number(r.fixedMarkup),
      priority: r.priority,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
}
