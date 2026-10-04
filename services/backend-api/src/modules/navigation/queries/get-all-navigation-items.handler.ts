import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TargetApp, NavigationItemDto } from '@smartfeed/shared';
import { GetAllNavigationItemsQuery } from '@/modules/navigation/queries/get-all-navigation-items.query';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';

@QueryHandler(GetAllNavigationItemsQuery)
export class GetAllNavigationItemsHandler implements IQueryHandler<GetAllNavigationItemsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(query: GetAllNavigationItemsQuery) {
    const { targetApp } = query;
    const cacheKey = `navigation:all:${targetApp ?? 'all'}`;

    const cached = await this.cache.get<NavigationItemDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const items = await this.prisma.navigationItem.findMany({
      where: targetApp ? { OR: [{ targetApp }, { targetApp: TargetApp.ALL }] } : undefined,
      orderBy: { order: 'asc' },
    });

    await this.cache.set(cacheKey, items, 3600);
    return items;
  }
}
