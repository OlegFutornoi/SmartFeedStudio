// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteSupplierFeedSourceCommand } from '@/modules/feeds/commands/delete-supplier-feed-source.command';

@CommandHandler(DeleteSupplierFeedSourceCommand)
export class DeleteSupplierFeedSourceHandler implements ICommandHandler<DeleteSupplierFeedSourceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    command: DeleteSupplierFeedSourceCommand,
  ): Promise<{ success: boolean; id: string }> {
    const { supplierId, sourceId, userId } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const current = await this.prisma.supplierFeedSource.findFirst({
      where: { id: sourceId, supplierId },
    });

    if (!current) {
      throw new NotFoundException(`Feed source ${sourceId} not found`);
    }

    await this.prisma.supplierFeedSource.delete({
      where: { id: sourceId },
    });

    return {
      success: true,
      id: sourceId,
    };
  }
}
