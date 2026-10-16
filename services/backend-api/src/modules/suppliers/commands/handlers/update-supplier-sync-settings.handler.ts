import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierSyncSettingsCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(UpdateSupplierSyncSettingsCommand)
export class UpdateSupplierSyncSettingsHandler implements ICommandHandler<UpdateSupplierSyncSettingsCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierSyncSettingsCommand) {
    const { supplierId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      include: { syncSettings: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    return this.prisma.supplierSyncSetting.upsert({
      where: { supplierId },
      update: dto,
      create: {
        supplierId,
        ...dto,
      },
    });
  }
}
