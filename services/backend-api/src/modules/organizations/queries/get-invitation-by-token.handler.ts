import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetInvitationByTokenQuery } from './get-invitation-by-token.query';

@Injectable()
@QueryHandler(GetInvitationByTokenQuery)
export class GetInvitationByTokenHandler implements IQueryHandler<GetInvitationByTokenQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetInvitationByTokenQuery) {
    const { token } = query;

    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        `Invitation is no longer active (status: ${invitation.status})`,
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      throw new BadRequestException('Invitation has expired. Please ask for a new invite.');
    }

    // Check if user already exists in DB
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true, email: true, fullName: true },
    });

    return {
      token: invitation.token,
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      inviterName: invitation.invitedBy?.fullName || invitation.invitedBy?.email || 'Адміністратор',
      isExistingUser: Boolean(existingUser),
      isValid: true,
      expiresAt: invitation.expiresAt,
    };
  }
}
