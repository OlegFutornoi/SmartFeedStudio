import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteNavigationItemCommand } from './delete-navigation-item.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisCacheService } from '../../../common/cache/redis-cache.service';

@CommandHandler(DeleteNavigationItemCommand)
export class DeleteNavigationItemHandler implements ICommandHandler<DeleteNavigationItemCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(command: DeleteNavigationItemCommand) {
    const { id } = command;

    const existing = await this.prisma.navigationItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Navigation item with ID "${id}" not found`);
    }

    const deleted = await this.prisma.navigationItem.delete({
      where: { id },
    });

    await this.cache.del('navigation:*');
    return deleted;
  }
}
