import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, MemberRole, JwtPayload, AuthResponseDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { AcceptInvitationCommand } from './accept-invitation.command';

@Injectable()
@CommandHandler(AcceptInvitationCommand)
export class AcceptInvitationHandler implements ICommandHandler<
  AcceptInvitationCommand,
  AuthResponseDto
> {
  private readonly logger = new Logger(AcceptInvitationHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<AuthResponseDto> {
    const { token, fullName, password, authenticatedUserId } = command;

    if (!token) {
      throw new BadRequestException('Token is required');
    }

    // 1. Find and validate invitation
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
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

    const organizationId = invitation.organizationId;

    // 2. Check team seats limit
    const currentMembersCount = await this.prisma.organizationMember.count({
      where: { organizationId },
    });

    const activeLicense =
      (await this.prisma.license.findFirst({
        where: { organizationId, isActive: true },
        orderBy: { createdAt: 'desc' },
      })) ||
      (await this.prisma.license.findFirst({
        where: { userId: invitation.organization.ownerId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }));

    const maxTeamSeats = activeLicense?.maxTeamSeats || 1;

    if (currentMembersCount >= maxTeamSeats) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'TEAM_SEATS_LIMIT_EXCEEDED',
        message: `Ліміт місць у команді вичерпано (${currentMembersCount}/${maxTeamSeats}). Зверніться до власника для апгрейду тарифу.`,
      });
    }

    // 3. Find or create user
    const normalizedEmail = invitation.email.toLowerCase().trim();
    let targetUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!targetUser) {
      // User does not exist yet -> Must provide password
      if (!password || password.length < 6) {
        throw new BadRequestException('Password is required and must be at least 6 characters');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userFullName = fullName?.trim() || normalizedEmail.split('@')[0];

      targetUser = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: userFullName,
          role: Role.USER,
        },
      });

      this.logger.log(`Created new user from accepted invitation: ${targetUser.email}`);
    } else {
      // User exists -> Security Verification
      if (authenticatedUserId && authenticatedUserId !== targetUser.id) {
        throw new ForbiddenException('Authenticated user email does not match invitation email');
      }

      // If password was provided on the accept form, strictly verify against user password hash
      if (password) {
        const isPasswordValid = await bcrypt.compare(password, targetUser.passwordHash);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Невірний пароль для існуючого облікового запису');
        }
      }
    }

    // 4. Check if already a member
    const existingMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      // Update invitation status to ACCEPTED even if already member
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      // 5. Create membership and accept invitation inside transaction
      await this.prisma.$transaction([
        this.prisma.organizationMember.create({
          data: {
            organizationId,
            userId: targetUser.id,
            role: invitation.role,
          },
        }),
        this.prisma.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        }),
      ]);

      this.logger.log(
        `User ${targetUser.email} joined org ${invitation.organization.name} as ${invitation.role}`,
      );
    }

    // 6. Generate JWT Auth Tokens
    const payload: JwtPayload = {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role as Role,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-access-token-key-change-in-production';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-token-key-change-in-production';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role as Role,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          role: invitation.role as MemberRole,
        },
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    };
  }
}
