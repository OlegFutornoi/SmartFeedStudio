import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role, PlanType, UserListItemDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserStatusCommand } from './update-user-status.command';

@Injectable()
@CommandHandler(UpdateUserStatusCommand)
export class UpdateUserStatusHandler implements ICommandHandler<
  UpdateUserStatusCommand,
  UserListItemDto
> {
  private readonly logger = new Logger(UpdateUserStatusHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserStatusCommand): Promise<UserListItemDto> {
    const { userId, isActive, requesterId } = command;

    if (requesterId && requesterId === userId && !isActive) {
      throw new BadRequestException('CANNOT_SUSPEND_OWN_ACCOUNT');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        licenses: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (existing.role === Role.SUPER_ADMIN && !isActive) {
      throw new ForbiddenException('CANNOT_SUSPEND_SUPER_ADMIN');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: {
        licenses: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    this.logger.log(`Updated user ${updated.email} (ID: ${userId}) status to isActive=${isActive}`);

    const primaryMembership =
      updated.organizationMemberships.find((m) => m.role === 'OWNER') ||
      updated.organizationMemberships[0];

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

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role as unknown as Role,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      organization,
      license: updated.licenses[0]
        ? {
            licenseKey: updated.licenses[0].licenseKey,
            planType: updated.licenses[0].planType as unknown as PlanType,
            isActive: updated.licenses[0].isActive,
            maxXmlLimit: updated.licenses[0].maxXmlLimit,
            aiCredits: updated.licenses[0].aiCredits,
          }
        : null,
    };
  }
}
