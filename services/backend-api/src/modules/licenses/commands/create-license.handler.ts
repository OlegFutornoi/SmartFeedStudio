import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { LicenseEntity, PlanType, PLAN_LIMITS_MAP, Role } from '@smartfeed/shared';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLicenseCommand } from './create-license.command';

@Injectable()
@CommandHandler(CreateLicenseCommand)
export class CreateLicenseHandler implements ICommandHandler<CreateLicenseCommand, LicenseEntity> {
  private readonly logger = new Logger(CreateLicenseHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateLicenseCommand): Promise<LicenseEntity> {
    const { userId, planType = PlanType.STARTER, expiresAt } = command;

    // Platform Super Admin does not hold customer licenses
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (targetUser?.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN_CANNOT_HAVE_LICENSE');
    }

    // Fetch dynamic plan from database if present, otherwise fallback to static map
    const dbPlan = await this.prisma.tariffPlan.findUnique({
      where: { code: planType },
    });

    const fallbackLimits = PLAN_LIMITS_MAP[planType] || PLAN_LIMITS_MAP[PlanType.STARTER];

    const canCloudBackup = dbPlan ? dbPlan.canCloudBackup : fallbackLimits.canCloudBackup;
    const maxXmlLimit = dbPlan ? dbPlan.maxXmlLimit : fallbackLimits.maxXmlLimit;
    const aiCredits = dbPlan ? dbPlan.aiCredits : fallbackLimits.aiCredits;
    const maxFeedsLimit = dbPlan ? dbPlan.maxFeedsLimit : fallbackLimits.maxFeedsLimit;
    const maxChannelsLimit = dbPlan ? dbPlan.maxChannelsLimit : fallbackLimits.maxChannelsLimit;
    const maxTeamSeats = dbPlan ? dbPlan.maxTeamSeats : fallbackLimits.maxTeamSeats;
    const maxSuppliersLimit = dbPlan ? dbPlan.maxSuppliersLimit : fallbackLimits.maxSuppliersLimit;
    const hasApiAccess = dbPlan ? dbPlan.hasApiAccess : fallbackLimits.hasApiAccess;
    const hasFeedDiff = dbPlan ? dbPlan.hasFeedDiff : fallbackLimits.hasFeedDiff;
    const hasWhiteLabel = dbPlan ? dbPlan.hasWhiteLabel : fallbackLimits.hasWhiteLabel;
    const hasSso = dbPlan ? dbPlan.hasSso : fallbackLimits.hasSso;
    const hasAuditLog = dbPlan ? dbPlan.hasAuditLog : fallbackLimits.hasAuditLog;
    const tariffPlanId = dbPlan ? dbPlan.id : null;

    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const licenseKey = `SF-${planType}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    const finalExpiresAt =
      expiresAt !== undefined
        ? expiresAt
        : dbPlan?.durationDays
          ? new Date(Date.now() + dbPlan.durationDays * 24 * 60 * 60 * 1000)
          : null;

    // Deactivate previous active licenses for this user
    await this.prisma.license.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const license = await this.prisma.license.create({
      data: {
        userId,
        licenseKey,
        planType,
        tariffPlanId,
        canCloudBackup,
        maxXmlLimit,
        aiCredits,
        maxFeedsLimit,
        maxChannelsLimit,
        maxTeamSeats,
        maxSuppliersLimit,
        hasApiAccess,
        hasFeedDiff,
        hasWhiteLabel,
        hasSso,
        hasAuditLog,
        isActive: true,
        expiresAt: finalExpiresAt,
      },
    });

    this.logger.log(`Created license ${license.licenseKey} for user ${userId}`);

    const isExpired = Boolean(license.expiresAt && new Date(license.expiresAt) < new Date());
    const daysRemaining = license.expiresAt
      ? Math.max(
          0,
          Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : null;

    return {
      id: license.id,
      userId: license.userId,
      licenseKey: license.licenseKey,
      planType: license.planType as PlanType,
      canCloudBackup: license.canCloudBackup,
      maxXmlLimit: license.maxXmlLimit,
      aiCredits: license.aiCredits,
      maxFeedsLimit: license.maxFeedsLimit,
      maxChannelsLimit: license.maxChannelsLimit,
      maxTeamSeats: license.maxTeamSeats,
      maxSuppliersLimit: license.maxSuppliersLimit,
      hasApiAccess: license.hasApiAccess,
      hasFeedDiff: license.hasFeedDiff,
      hasWhiteLabel: license.hasWhiteLabel,
      hasSso: license.hasSso,
      hasAuditLog: license.hasAuditLog,
      isActive: license.isActive,
      expiresAt: license.expiresAt,
      isExpired,
      daysRemaining,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
    };
  }
}
