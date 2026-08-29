import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeleteProductCommand } from './delete-product.command';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteProductCommand): Promise<{ success: boolean }> {
    const { id, userId } = command;

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        catalog: { userId },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { success: true };
  }
}
