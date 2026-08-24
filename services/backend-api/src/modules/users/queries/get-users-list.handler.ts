import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersListQuery } from './get-users-list.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserListItemDto } from '@smartfeed/shared';

@QueryHandler(GetUsersListQuery)
export class GetUsersListHandler implements IQueryHandler<GetUsersListQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUsersListQuery): Promise<UserListItemDto[]> {
    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      where.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        licenses: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role as any,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      license: u.licenses[0]
        ? {
            licenseKey: u.licenses[0].licenseKey,
            planType: u.licenses[0].planType as any,
            isActive: u.licenses[0].isActive,
            maxXmlLimit: u.licenses[0].maxXmlLimit,
            aiCredits: u.licenses[0].aiCredits,
          }
        : null,
    }));
  }
}
