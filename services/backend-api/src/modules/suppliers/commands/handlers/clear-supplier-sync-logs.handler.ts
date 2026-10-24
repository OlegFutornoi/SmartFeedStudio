// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ClearSupplierSyncLogsCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(ClearSupplierSyncLogsCommand)
export class ClearSupplierSyncLogsHandler implements ICommandHandler<ClearSupplierSyncLogsCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ClearSupplierSyncLogsCommand) {
    const { supplierId, userId } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const res = await this.prisma.supplierSyncLog.deleteMany({
      where: { supplierId },
    });

    return {
      success: true,
      deletedCount: res.count,
    };
  }
}
