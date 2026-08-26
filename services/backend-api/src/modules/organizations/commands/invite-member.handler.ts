import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MemberRole, Role } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { InviteMemberCommand } from './invite-member.command';

@Injectable()
@CommandHandler(InviteMemberCommand)
export class InviteMemberHandler implements ICommandHandler<InviteMemberCommand> {
  private readonly logger = new Logger(InviteMemberHandler.name);

  constructor(private readonly prisma: PrismaService) {}

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
    });

    if (
      !requesterMember ||
      (requesterMember.role !== 'OWNER' && requesterMember.role !== 'ADMIN')
    ) {
      throw new ForbiddenException('Only organization owners or admins can invite team members');
    }

    // 3. Find or auto-create target user
    let targetUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!targetUser) {
      const tempPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      targetUser = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.USER,
        },
      });
      this.logger.log(`Created new user account for invited email: ${normalizedEmail}`);
    }

    // 4. Check if user is already a member
    const existingMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        `User "${normalizedEmail}" is already a member of this organization`,
      );
    }

    // 5. Team Seats Quota Check
    const currentMembersCount = await this.prisma.organizationMember.count({
      where: { organizationId },
    });

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

    if (currentMembersCount >= maxTeamSeats) {
      this.logger.warn(
        `Team seats limit reached for organization "${organizationId}": current=${currentMembersCount}, max=${maxTeamSeats}`,
      );
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'TEAM_SEATS_LIMIT_EXCEEDED',
        message: `Ваш тариф дозволяє лише ${maxTeamSeats} місць у команді. Оновіть тариф до PRO або ENTERPRISE.`,
        currentMembersCount,
        maxTeamSeats,
      });
    }

    // 6. Create organization member
    const memberRole = (role || MemberRole.MEMBER) as any;
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: targetUser.id,
        role: memberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    this.logger.log(
      `Member added to organization "${organizationId}": user=${targetUser.id}, email=${targetUser.email}, role=${member.role}`,
    );

    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      userEmail: member.user.email,
      userFullName: member.user.fullName,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
