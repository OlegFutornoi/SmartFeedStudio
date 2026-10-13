import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteSupplierCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(DeleteSupplierCommand)
export class DeleteSupplierHandler implements ICommandHandler<DeleteSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteSupplierCommand) {
    const { id, userId } = command;

    const current = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });
    if (!current) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }

    await this.prisma.supplier.delete({
      where: { id },
    });

    return { success: true };
  }
}
