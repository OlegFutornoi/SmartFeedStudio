import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetOrganizationMembersQuery } from './get-organization-members.query';

@Injectable()
@QueryHandler(GetOrganizationMembersQuery)
export class GetOrganizationMembersHandler implements IQueryHandler<GetOrganizationMembersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrganizationMembersQuery) {
    const { organizationId, userId } = query;

    // Check membership
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: You are not a member of this organization');
    }

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      email: m.user.email,
      userEmail: m.user.email,
      fullName: m.user.fullName,
      userFullName: m.user.fullName,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }
}
