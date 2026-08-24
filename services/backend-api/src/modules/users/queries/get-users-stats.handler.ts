import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersStatsQuery } from './get-users-stats.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersStatsDto } from '@smartfeed/shared';

@QueryHandler(GetUsersStatsQuery)
export class GetUsersStatsHandler implements IQueryHandler<GetUsersStatsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<UsersStatsDto> {
    const [totalUsers, activeLicenses, superAdminsCount, standardUsersCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.license.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      this.prisma.user.count({ where: { role: 'USER' } }),
    ]);

    return {
      totalUsers,
      activeLicenses,
      superAdminsCount,
      standardUsersCount,
    };
  }
}
