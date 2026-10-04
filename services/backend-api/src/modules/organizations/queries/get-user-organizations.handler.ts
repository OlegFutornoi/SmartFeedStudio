import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUserOrganizationsQuery } from '@/modules/organizations/queries/get-user-organizations.query';

@Injectable()
@QueryHandler(GetUserOrganizationsQuery)
export class GetUserOrganizationsHandler implements IQueryHandler<GetUserOrganizationsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserOrganizationsQuery) {
    const { userId } = query;

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              select: { id: true },
            },
            licenses: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => {
      const org = m.organization;
      const activeLicense = org.licenses[0];
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerId: org.ownerId,
        userRole: m.role,
        usedTeamSeats: org.members.length,
        maxTeamSeats: activeLicense?.maxTeamSeats || 1,
        activePlan: activeLicense?.planType || 'STARTER',
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      };
    });
  }
}
