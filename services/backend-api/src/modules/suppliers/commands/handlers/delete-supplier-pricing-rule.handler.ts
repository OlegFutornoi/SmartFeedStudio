import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteSupplierPricingRuleCommand } from '@/modules/suppliers/commands/suppliers.commands';

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
