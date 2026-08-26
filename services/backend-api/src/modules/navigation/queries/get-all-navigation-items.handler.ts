import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TargetApp } from '@smartfeed/shared';
import { GetAllNavigationItemsQuery } from './get-all-navigation-items.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetAllNavigationItemsQuery)
export class GetAllNavigationItemsHandler implements IQueryHandler<GetAllNavigationItemsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAllNavigationItemsQuery) {
    const { targetApp } = query;

    return this.prisma.navigationItem.findMany({
      where: targetApp ? { OR: [{ targetApp }, { targetApp: TargetApp.ALL }] } : undefined,
      orderBy: { order: 'asc' },
    });
  }
}
