import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeleteSupplierCommand } from './delete-supplier.command';

@CommandHandler(DeleteSupplierCommand)
export class DeleteSupplierHandler implements ICommandHandler<DeleteSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteSupplierCommand): Promise<{ success: boolean }> {
    const { id, userId } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    await this.prisma.supplier.delete({
      where: { id },
    });

    return { success: true };
  }
}
