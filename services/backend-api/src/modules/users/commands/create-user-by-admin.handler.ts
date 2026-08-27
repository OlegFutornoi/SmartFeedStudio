import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AccountType, PLAN_LIMITS_MAP, PlanType, Role, UserListItemDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserByAdminCommand } from './create-user-by-admin.command';

@Injectable()
@CommandHandler(CreateUserByAdminCommand)
export class CreateUserByAdminHandler implements ICommandHandler<
  CreateUserByAdminCommand,
  UserListItemDto
> {
  private readonly logger = new Logger(CreateUserByAdminHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateUserByAdminCommand): Promise<UserListItemDto> {
    const { email, password, fullName, role, accountType, companyName, organizationId, planCode } =
      command;

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Uniqueness check
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException(`User with email "${normalizedEmail}" already exists`);
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create user
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        role,
      },
    });

    // 4. Handle organization structure (only for Role.USER accounts)
    let orgId: string | null = null;

    if (role === Role.USER) {
      if (accountType === AccountType.MEMBER) {
        // Attach to an existing organization
        if (!organizationId) {
          throw new BadRequestException('organizationId is required when accountType is MEMBER');
        }
        const org = await this.prisma.organization.findUnique({
          where: { id: organizationId },
        });
        if (!org) {
          throw new NotFoundException(`Organization "${organizationId}" not found`);
        }
        await this.prisma.organizationMember.create({
          data: { userId: user.id, organizationId, role: 'MEMBER' },
        });
        orgId = organizationId;
      } else {
        // Default (OWNER): Every user has an organization
        const orgName =
          companyName?.trim() ||
          (user.fullName
            ? `Компанія ${user.fullName}`
            : `Компанія ${normalizedEmail.split('@')[0]}`);
        const org = await this.prisma.organization.create({
          data: {
            name: orgName,
            ownerId: user.id,
            members: {
              create: { userId: user.id, role: 'OWNER' },
            },
          },
        });
        orgId = org.id;
      }

      // 5. Auto-provision license only for OWNER accounts
      if (accountType === AccountType.OWNER) {
        const selectedPlan = planCode ?? PlanType.STARTER;
        const limits = PLAN_LIMITS_MAP[selectedPlan];

        const dbPlan = await this.prisma.tariffPlan.findUnique({ where: { code: selectedPlan } });

        const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
        const licenseKey = `SF-${selectedPlan}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

        const expiresAt = dbPlan?.durationDays
          ? new Date(Date.now() + dbPlan.durationDays * 24 * 60 * 60 * 1000)
          : null;

        await this.prisma.license.create({
          data: {
            userId: user.id,
            organizationId: orgId,
            licenseKey,
            planType: selectedPlan,
            tariffPlanId: dbPlan?.id ?? null,
            canCloudBackup: dbPlan?.canCloudBackup ?? limits.canCloudBackup,
            maxXmlLimit: dbPlan?.maxXmlLimit ?? limits.maxXmlLimit,
            aiCredits: dbPlan?.aiCredits ?? limits.aiCredits,
            maxFeedsLimit: dbPlan?.maxFeedsLimit ?? limits.maxFeedsLimit,
            maxChannelsLimit: dbPlan?.maxChannelsLimit ?? limits.maxChannelsLimit,
            maxTeamSeats: dbPlan?.maxTeamSeats ?? limits.maxTeamSeats,
            maxSuppliersLimit: dbPlan?.maxSuppliersLimit ?? limits.maxSuppliersLimit,
            hasApiAccess: dbPlan?.hasApiAccess ?? limits.hasApiAccess,
            hasFeedDiff: dbPlan?.hasFeedDiff ?? limits.hasFeedDiff,
            hasWhiteLabel: dbPlan?.hasWhiteLabel ?? limits.hasWhiteLabel,
            hasSso: dbPlan?.hasSso ?? limits.hasSso,
            hasAuditLog: dbPlan?.hasAuditLog ?? limits.hasAuditLog,
            isActive: true,
            expiresAt,
          },
        });

        this.logger.log(
          `Admin created user (OWNER): id=${user.id}, email=${user.email}, plan=${selectedPlan}`,
        );
      } else {
        this.logger.log(
          `Admin created user (MEMBER): id=${user.id}, email=${user.email}, orgId=${orgId}`,
        );
      }
    } else {
      this.logger.log(
        `Admin created system user: id=${user.id}, email=${user.email}, role=${user.role}`,
      );
    }

    // 6. Fetch and return full UserListItemDto shape
    const createdUser = await this.prisma.user.findUnique({
      where: { id: user.id },
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
                licenses: {
                  where: { isActive: true },
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
                owner: { select: { id: true, email: true, fullName: true } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });

    if (!createdUser) {
      throw new NotFoundException(`User "${user.id}" not found after creation`);
    }

    const membership = createdUser.organizationMemberships[0] ?? null;
    const effectiveLicense =
      createdUser.licenses[0] ?? membership?.organization?.licenses?.[0] ?? null;

    return {
      id: createdUser.id,
      email: createdUser.email,
      fullName: createdUser.fullName,
      role: createdUser.role as Role,
      license: effectiveLicense
        ? {
            licenseKey: effectiveLicense.licenseKey,
            planType: effectiveLicense.planType as PlanType,
            isActive: effectiveLicense.isActive,
            maxXmlLimit: effectiveLicense.maxXmlLimit,
            aiCredits: effectiveLicense.aiCredits,
          }
        : null,
      organization: membership
        ? {
            organizationId: membership.organizationId,
            organizationName: membership.organization.name,
            memberRole: membership.role as 'OWNER' | 'ADMIN' | 'MEMBER',
            isOwner: membership.role === 'OWNER',
            ownerEmail: membership.organization.owner?.email ?? null,
            ownerFullName: membership.organization.owner?.fullName ?? null,
          }
        : null,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };
  }
}
