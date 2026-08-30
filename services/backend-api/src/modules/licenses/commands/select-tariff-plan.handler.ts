import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LicenseEntity, PlanType, PLAN_LIMITS_MAP } from '@smartfeed/shared';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SelectTariffPlanCommand } from './select-tariff-plan.command';

@Injectable()
@CommandHandler(SelectTariffPlanCommand)
export class SelectTariffPlanHandler implements ICommandHandler<
  SelectTariffPlanCommand,
  LicenseEntity
> {
  private readonly logger = new Logger(SelectTariffPlanHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SelectTariffPlanCommand): Promise<LicenseEntity> {
    const { userId, planCode, billingInterval = 'monthly' } = command;
    const normalizedCode = planCode.toUpperCase().trim();

    // 1. Fetch requested tariff plan
    const dbPlan = await this.prisma.tariffPlan.findUnique({
      where: { code: normalizedCode },
    });

    if (!dbPlan || !dbPlan.isActive) {
      throw new NotFoundException(
        `Tariff plan with code "${normalizedCode}" not found or inactive`,
      );
    }

    const planTypeEnum = Object.values(PlanType).includes(normalizedCode as PlanType)
      ? (normalizedCode as PlanType)
      : PlanType.STARTER;

    const fallbackLimits = PLAN_LIMITS_MAP[planTypeEnum] || PLAN_LIMITS_MAP[PlanType.STARTER];

    // Prefer DB values; fall back to static map
    const canCloudBackup = dbPlan.canCloudBackup ?? fallbackLimits.canCloudBackup;
    const maxXmlLimit = dbPlan.maxXmlLimit ?? fallbackLimits.maxXmlLimit;
    const aiCredits = dbPlan.aiCredits ?? fallbackLimits.aiCredits;
    const maxFeedsLimit = dbPlan.maxFeedsLimit ?? fallbackLimits.maxFeedsLimit;
    const maxChannelsLimit = dbPlan.maxChannelsLimit ?? fallbackLimits.maxChannelsLimit;
    const maxTeamSeats = dbPlan.maxTeamSeats ?? fallbackLimits.maxTeamSeats;
    const maxSuppliersLimit = dbPlan.maxSuppliersLimit ?? fallbackLimits.maxSuppliersLimit;
    const hasApiAccess = dbPlan.hasApiAccess ?? fallbackLimits.hasApiAccess;
    const hasFeedDiff = dbPlan.hasFeedDiff ?? fallbackLimits.hasFeedDiff;
    const hasWhiteLabel = dbPlan.hasWhiteLabel ?? fallbackLimits.hasWhiteLabel;
    const hasSso = dbPlan.hasSso ?? fallbackLimits.hasSso;
    const hasAuditLog = dbPlan.hasAuditLog ?? fallbackLimits.hasAuditLog;

    const durationDays =
      billingInterval === 'yearly' && Number(dbPlan.priceYearly || 0) > 0
        ? 365
        : (dbPlan.durationDays ?? 30);

    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    // 2. Check user's organization roles
    const ownedOrgMembership = await this.prisma.organizationMember.findFirst({
      where: { userId, role: 'OWNER' },
      include: { organization: true },
    });

    const anyMembership = await this.prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!ownedOrgMembership && anyMembership && anyMembership.role !== 'OWNER') {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'ONLY_OWNER_CAN_CHANGE_PLAN',
        message: 'Тільки власник організації має право змінювати або оплачувати тарифний план',
        details:
          'You are an invited member of this workspace. Plan selection is managed by the organization owner.',
      });
    }

    const orgMembership = ownedOrgMembership || anyMembership;
    const organizationId = orgMembership?.organizationId || null;
    const organizationName = orgMembership?.organization?.name || null;

    // 3. Deactivate previous active licenses and create fresh active license inside an atomic transaction
    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const licenseKey = `SF-${normalizedCode}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    const license = await this.prisma.$transaction(async (tx) => {
      await tx.license.updateMany({
        where: {
          OR: [
            { userId, isActive: true },
            ...(organizationId ? [{ organizationId, isActive: true }] : []),
          ],
        },
        data: { isActive: false },
      });

      return tx.license.create({
        data: {
          userId,
          organizationId,
          licenseKey,
          planType: planTypeEnum,
          tariffPlanId: dbPlan.id,
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
          expiresAt,
        },
        include: {
          tariffPlan: true,
          organization: true,
        },
      });
    });

    this.logger.log(
      `User ${userId} selected plan ${normalizedCode} for org ${organizationId || 'none'} (expiresAt: ${expiresAt?.toISOString() || 'never'})`,
    );

    const daysRemaining = license.expiresAt
      ? Math.max(
          0,
          Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : null;

    return {
      id: license.id,
      userId: license.userId,
      organizationId: license.organizationId || organizationId,
      organizationName: license.organization?.name || organizationName,
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
      isExpired: false,
      daysRemaining,
      tariffPlan: {
        id: dbPlan.id,
        code: dbPlan.code,
        nameUk: dbPlan.nameUk,
        nameEn: dbPlan.nameEn,
        descriptionUk: dbPlan.descriptionUk,
        descriptionEn: dbPlan.descriptionEn,
        priceMonthly: Number(dbPlan.priceMonthly),
        priceYearly: dbPlan.priceYearly ? Number(dbPlan.priceYearly) : null,
        currency: dbPlan.currency,
        maxXmlLimit: dbPlan.maxXmlLimit,
        aiCredits: dbPlan.aiCredits,
        canCloudBackup: dbPlan.canCloudBackup,
        maxFeedsLimit: dbPlan.maxFeedsLimit,
        maxChannelsLimit: dbPlan.maxChannelsLimit,
        maxTeamSeats: dbPlan.maxTeamSeats,
        maxSuppliersLimit: dbPlan.maxSuppliersLimit,
        hasApiAccess: dbPlan.hasApiAccess,
        hasFeedDiff: dbPlan.hasFeedDiff,
        isPopular: dbPlan.isPopular,
        isActive: dbPlan.isActive,
        order: dbPlan.order,
        durationDays: dbPlan.durationDays,
        featuresUk: dbPlan.featuresUk,
        featuresEn: dbPlan.featuresEn,
        createdAt: dbPlan.createdAt,
        updatedAt: dbPlan.updatedAt,
      },
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
    };
  }
}
