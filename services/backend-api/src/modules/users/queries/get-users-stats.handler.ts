import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersStatsQuery } from '@/modules/users/queries/get-users-stats.query';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersStatsDto } from '@smartfeed/shared';

@QueryHandler(GetUsersStatsQuery)
export class GetUsersStatsHandler implements IQueryHandler<GetUsersStatsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<UsersStatsDto> {
    const [userRoleGroups, activeLicenses] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      this.prisma.license.count({ where: { isActive: true } }),
    ]);

    let adminsCount = 0;
    let standardUsersCount = 0;

    for (const group of userRoleGroups) {
      if (group.role === 'ADMIN') {
        adminsCount = group._count.id;
      } else if (group.role === 'USER') {
        standardUsersCount = group._count.id;
      }
    }

    const totalUsers = adminsCount + standardUsersCount;

    return {
      totalUsers,
      activeLicenses,
      superAdminsCount: adminsCount,
      standardUsersCount,
    };
  }
}
