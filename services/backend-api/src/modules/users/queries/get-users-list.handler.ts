import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma, Role as PrismaRole } from '@/generated/prisma/client';
import { GetUsersListQuery } from '@/modules/users/queries/get-users-list.query';
import { PrismaService } from '@/prisma/prisma.service';
import { UserListItemDto, Role as SharedRole, PlanType as SharedPlanType } from '@smartfeed/shared';

@QueryHandler(GetUsersListQuery)
export class GetUsersListHandler implements IQueryHandler<GetUsersListQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUsersListQuery): Promise<UserListItemDto[]> {
    const andConditions: Prisma.UserWhereInput[] = [];

    // 1. Exclude SUPER_ADMIN always
    if (query.role) {
      if (query.role === SharedRole.SUPER_ADMIN) {
        return [];
      }
      andConditions.push({ role: query.role as PrismaRole });
    } else {
      andConditions.push({ role: { not: PrismaRole.SUPER_ADMIN } });
    }

    // 2. Team / Org Role Filter
    if (query.orgRoleFilter === 'OWNERS') {
      andConditions.push({ organizationMemberships: { some: { role: 'OWNER' } } });
    } else if (query.orgRoleFilter === 'MEMBERS') {
      andConditions.push({
        organizationMemberships: { some: { role: { in: ['ADMIN', 'MEMBER'] } } },
      });
    } else if (!query.search || query.search.trim() === '') {
      // By default in hierarchical table view, top-level rows are OWNERS or Standalone users (members appear nested inside their owner)
      andConditions.push({
        OR: [
          { organizationMemberships: { none: {} } },
          { organizationMemberships: { some: { role: 'OWNER' } } },
        ],
      });
    }

    // 3. Search by name or email
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      andConditions.push({
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const users = await this.prisma.user.findMany({
      where,
      include: {
        licenses: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        organizationMemberships: {
          include: {
            organization: {
              include: {
                owner: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    licenses: {
                      where: { isActive: true },
                      take: 1,
                      orderBy: { createdAt: 'desc' },
                    },
                  },
                },
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                      },
                    },
                  },
                  orderBy: { joinedAt: 'asc' },
                },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
      skip: query.offset ?? 0,
    });

    return users.map((u) => {
      const primaryMembership =
        u.organizationMemberships.find((m) => m.role === 'OWNER') || u.organizationMemberships[0];

      const organization = primaryMembership?.organization
        ? {
            organizationId: primaryMembership.organization.id,
            organizationName: primaryMembership.organization.name,
            memberRole: primaryMembership.role as 'OWNER' | 'ADMIN' | 'MEMBER',
            isOwner: primaryMembership.role === 'OWNER',
            ownerEmail: primaryMembership.organization.owner?.email || null,
            ownerFullName: primaryMembership.organization.owner?.fullName || null,
          }
        : null;

      let teamMembers: UserListItemDto[] = [];
      let membersCount = 0;

      // Team members are strictly attached ONLY if current user is the OWNER of the organization
      // AND we are NOT filtering strictly for OWNERS (because when filtering for OWNERS, only owners are shown)
      if (primaryMembership?.role === 'OWNER' && primaryMembership?.organization?.members) {
        const orgMembers = primaryMembership.organization.members.filter(
          (m) => m.userId !== u.id && m.role !== 'OWNER',
        );
        membersCount = orgMembers.length;

        if (query.orgRoleFilter !== 'OWNERS') {
          teamMembers = orgMembers.map((m) => ({
            id: m.user.id,
            email: m.user.email,
            fullName: m.user.fullName,
            role: m.user.role as unknown as SharedRole,
            isActive: m.user.isActive,
            createdAt: m.user.createdAt,
            updatedAt: m.user.updatedAt,
            organization: {
              organizationId: primaryMembership.organization.id,
              organizationName: primaryMembership.organization.name,
              memberRole: m.role as 'OWNER' | 'ADMIN' | 'MEMBER',
              isOwner: false,
              ownerEmail: u.email,
              ownerFullName: u.fullName || null,
            },
            license: u.licenses[0]
              ? {
                  licenseKey: u.licenses[0].licenseKey,
                  planType: u.licenses[0].planType as unknown as SharedPlanType,
                  isActive: u.licenses[0].isActive,
                  maxXmlLimit: u.licenses[0].maxXmlLimit,
                  aiCredits: u.licenses[0].aiCredits,
                }
              : null,
          }));
        }
      }

      const ownerWithLicenses = primaryMembership?.organization?.owner as
        { licenses?: typeof u.licenses } | undefined;
      const activeLicense = u.licenses[0] || ownerWithLicenses?.licenses?.[0];

      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role as unknown as SharedRole,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        organization,
        membersCount,
        teamMembers,
        license: activeLicense
          ? {
              licenseKey: activeLicense.licenseKey,
              planType: activeLicense.planType as unknown as SharedPlanType,
              isActive: activeLicense.isActive,
              maxXmlLimit: activeLicense.maxXmlLimit,
              aiCredits: activeLicense.aiCredits,
            }
          : null,
      };
    });
  }
}
