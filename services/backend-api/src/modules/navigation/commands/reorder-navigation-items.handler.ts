import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReorderNavigationItemsCommand } from './reorder-navigation-items.command';
import { PrismaService } from '../../../prisma/prisma.service';

@CommandHandler(ReorderNavigationItemsCommand)
export class ReorderNavigationItemsHandler implements ICommandHandler<ReorderNavigationItemsCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ReorderNavigationItemsCommand) {
    const { dto } = command;

    const updates = dto.items.map((item) =>
      this.prisma.navigationItem.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    );

    return this.prisma.$transaction(updates);
  }
}
