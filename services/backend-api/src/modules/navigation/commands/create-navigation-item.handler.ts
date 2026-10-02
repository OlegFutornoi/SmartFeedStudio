import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { CreateNavigationItemCommand } from './create-navigation-item.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisCacheService } from '../../../common/cache/redis-cache.service';

@CommandHandler(CreateNavigationItemCommand)
export class CreateNavigationItemHandler implements ICommandHandler<CreateNavigationItemCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(command: CreateNavigationItemCommand) {
    const { dto } = command;

    const existing = await this.prisma.navigationItem.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Navigation item with key "${dto.key}" already exists`);
    }

    const created = await this.prisma.navigationItem.create({
      data: {
        key: dto.key,
        labelUk: dto.labelUk,
        labelEn: dto.labelEn,
        path: dto.path,
        icon: dto.icon || 'LayoutDashboard',
        order: dto.order ?? 0,
        isVisible: dto.isVisible ?? true,
        requiredRoles: dto.requiredRoles,
        requiredPlan: dto.requiredPlan,
        targetApp: dto.targetApp,
      },
    });

    await this.cache.del('navigation:*');
    return created;
  }
}
