import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetOrganizationByIdQuery } from '@/modules/organizations/queries/get-organization-by-id.query';

@Injectable()
@QueryHandler(GetOrganizationByIdQuery)
export class GetOrganizationByIdHandler implements IQueryHandler<GetOrganizationByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrganizationByIdQuery) {
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

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        licenses: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with id "${organizationId}" not found`);
    }

    const activeLicense = organization.licenses[0];

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      ownerId: organization.ownerId,
      currentUserRole: membership.role,
      usedTeamSeats: organization.members.length,
      maxTeamSeats: activeLicense?.maxTeamSeats || 1,
      activePlan: activeLicense?.planType || 'STARTER',
      members: organization.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        fullName: m.user.fullName,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
