import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { GetOrganizationInvitationsQuery } from '@/modules/organizations/queries/get-organization-invitations.query';

@Injectable()
@QueryHandler(GetOrganizationInvitationsQuery)
export class GetOrganizationInvitationsHandler implements IQueryHandler<GetOrganizationInvitationsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async execute(query: GetOrganizationInvitationsQuery) {
    const { organizationId, requesterUserId } = query;

    // 1. Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with id "${organizationId}" not found`);
    }

    // 2. Check permissions
    const requesterMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterUserId,
        },
      },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== 'OWNER' && requesterMember.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only organization owners or admins can view invitations');
    }

    // 3. Find pending invitations
    const invitations = await this.prisma.organizationInvitation.findMany({
      where: {
        organizationId,
        status: 'PENDING',
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:1420');

    return invitations.map((inv) => ({
      id: inv.id,
      organizationId: inv.organizationId,
      organizationName: organization.name,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      inviteUrl: `${appUrl}/invite?token=${inv.token}`,
      status: inv.status,
      invitedById: inv.invitedById,
      invitedByName: inv.invitedBy?.fullName || inv.invitedBy?.email,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));
  }
}
