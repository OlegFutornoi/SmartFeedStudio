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

    // 3. Pre-checks & plan resolution
    if (role === Role.USER && accountType === AccountType.MEMBER) {
      if (!organizationId) {
        throw new BadRequestException('organizationId is required when accountType is MEMBER');
      }
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!org) {
        throw new NotFoundException(`Organization "${organizationId}" not found`);
      }
    }

    const selectedPlan = planCode ?? PlanType.STARTER;
    const limits = PLAN_LIMITS_MAP[selectedPlan] || PLAN_LIMITS_MAP[PlanType.STARTER];
    const dbPlan =
      role === Role.USER && accountType === AccountType.OWNER
        ? await this.prisma.tariffPlan.findUnique({ where: { code: selectedPlan } })
        : null;

    // 4. Create user, organization structure, and license atomically
    const { user, orgId } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: fullName.trim(),
          role,
        },
      });

      let assignedOrgId: string | null = null;

      if (role === Role.USER) {
        if (accountType === AccountType.MEMBER) {
          await tx.organizationMember.create({
            data: { userId: createdUser.id, organizationId: organizationId!, role: 'MEMBER' },
          });
          assignedOrgId = organizationId!;
        } else {
          const orgName =
            companyName?.trim() ||
            (createdUser.fullName
              ? `Компанія ${createdUser.fullName}`
              : `Компанія ${normalizedEmail.split('@')[0]}`);
          const org = await tx.organization.create({
            data: {
              name: orgName,
              ownerId: createdUser.id,
              members: {
                create: { userId: createdUser.id, role: 'OWNER' },
              },
            },
          });
          assignedOrgId = org.id;
        }

        if (accountType === AccountType.OWNER) {
          const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
          const licenseKey = `SF-${selectedPlan}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

          const expiresAt = dbPlan?.durationDays
            ? new Date(Date.now() + dbPlan.durationDays * 24 * 60 * 60 * 1000)
            : null;

          await tx.license.create({
            data: {
              userId: createdUser.id,
              organizationId: assignedOrgId,
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
        }
      }

      return { user: createdUser, orgId: assignedOrgId };
    });

    if (role === Role.USER) {
      if (accountType === AccountType.OWNER) {
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
