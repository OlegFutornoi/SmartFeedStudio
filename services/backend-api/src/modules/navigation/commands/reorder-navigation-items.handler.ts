import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReorderNavigationItemsCommand } from '@/modules/navigation/commands/reorder-navigation-items.command';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';

@CommandHandler(ReorderNavigationItemsCommand)
export class ReorderNavigationItemsHandler implements ICommandHandler<ReorderNavigationItemsCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(command: ReorderNavigationItemsCommand) {
    const { dto } = command;

    const updates = dto.items.map((item) =>
      this.prisma.navigationItem.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    );

    const result = await this.prisma.$transaction(updates);
    await this.cache.del('navigation:*');
    return result;
  }
}
