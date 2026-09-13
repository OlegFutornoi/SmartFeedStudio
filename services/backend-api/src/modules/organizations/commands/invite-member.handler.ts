import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MemberRole } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { InviteMemberCommand } from './invite-member.command';
import { organizationMutex } from '../utils/organization-mutex';

@Injectable()
@CommandHandler(InviteMemberCommand)
export class InviteMemberHandler implements ICommandHandler<InviteMemberCommand> {
  private readonly logger = new Logger(InviteMemberHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async execute(command: InviteMemberCommand) {
    const { organizationId, requesterUserId, email, role } = command;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with id "${organizationId}" not found`);
    }

    // 2. Verify requester has OWNER or ADMIN permissions
    const requesterMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterUserId,
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== 'OWNER' && requesterMember.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only organization owners or admins can invite team members');
    }

    // 3. Check if user with this email is already an active member of this organization
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: {
          email: normalizedEmail,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(
        `User "${normalizedEmail}" is already an active member of this organization`,
      );
    }

    // 4. Team Seats Quota Check (Active Members + Pending Invitations with Mutex Protection)
    return organizationMutex.runExclusive(organizationId, async () => {
      const [currentMembersCount, pendingInvitesCount] = await Promise.all([
        this.prisma.organizationMember.count({
          where: { organizationId },
        }),
        this.prisma.organizationInvitation.count({
          where: {
            organizationId,
            status: 'PENDING',
          },
        }),
      ]);

      // Find active license for organization (or fallback to owner's active license)
      const activeLicense =
        (await this.prisma.license.findFirst({
          where: { organizationId, isActive: true },
          orderBy: { createdAt: 'desc' },
        })) ||
        (await this.prisma.license.findFirst({
          where: { userId: organization.ownerId, isActive: true },
          orderBy: { createdAt: 'desc' },
        }));

      const maxTeamSeats = activeLicense?.maxTeamSeats || 1;

      // Check if there is already a PENDING invitation for this email
      const existingInvitation = await this.prisma.organizationInvitation.findFirst({
        where: {
          organizationId,
          email: normalizedEmail,
          status: 'PENDING',
        },
      });

      // If renewing an existing invite for the same email, it already occupies a slot
      const totalOccupiedSeats = currentMembersCount + pendingInvitesCount;
      const effectiveOccupiedSeats = existingInvitation
        ? totalOccupiedSeats - 1
        : totalOccupiedSeats;

      if (effectiveOccupiedSeats >= maxTeamSeats) {
        this.logger.warn(
          `Team seats limit reached for organization "${organizationId}": current=${effectiveOccupiedSeats}, max=${maxTeamSeats}`,
        );
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          code: 'TEAM_SEATS_LIMIT_EXCEEDED',
          message: `Ліміт місць у команді вичерпано (${effectiveOccupiedSeats}/${maxTeamSeats} місць у команді). Зверніться до власника для апгрейду тарифу.`,
          currentMembersCount: effectiveOccupiedSeats,
          maxTeamSeats,
        });
      }

      // 5. Generate secure token & expiration (7 days)
      const token = `SF-INV-${crypto.randomBytes(24).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const memberRole = (role as MemberRole) || MemberRole.MEMBER;

      let invitation;
      if (existingInvitation) {
        invitation = await this.prisma.organizationInvitation.update({
          where: { id: existingInvitation.id },
          data: {
            token,
            role: memberRole,
            expiresAt,
            invitedById: requesterUserId,
          },
        });
        this.logger.log(`Refreshed existing invitation for ${normalizedEmail} (token renewed)`);
      } else {
        invitation = await this.prisma.organizationInvitation.create({
          data: {
            organizationId,
            email: normalizedEmail,
            role: memberRole,
            token,
            expiresAt,
            invitedById: requesterUserId,
          },
        });
        this.logger.log(
          `Created new invitation for ${normalizedEmail} to org ${organization.name}`,
        );
      }

      // 6. Form invite URL
      const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:1420');
      const inviteUrl = `${appUrl}/invite?token=${token}`;

      // 7. Send notification email via MailService (asynchronously, with fallback)
      const inviterName =
        requesterMember.user?.fullName || requesterMember.user?.email || 'Адміністратор';

      this.mailService
        .sendInvitationEmail({
          to: normalizedEmail,
          inviterName,
          organizationName: organization.name,
          role: memberRole,
          token,
          inviteUrl,
          expiresAt,
        })
        .catch((err) => {
          this.logger.warn(`Non-blocking email sending error: ${err?.message}`);
        });

      return {
        id: invitation.id,
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        inviteUrl,
        status: invitation.status,
        invitedById: invitation.invitedById,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      };
    });
  }
}
