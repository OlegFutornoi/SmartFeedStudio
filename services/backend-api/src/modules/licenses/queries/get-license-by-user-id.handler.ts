import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { LicenseEntity, PlanType } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetLicenseByUserIdQuery } from './get-license-by-user-id.query';

@Injectable()
@QueryHandler(GetLicenseByUserIdQuery)
export class GetLicenseByUserIdHandler implements IQueryHandler<
  GetLicenseByUserIdQuery,
  LicenseEntity | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLicenseByUserIdQuery): Promise<LicenseEntity | null> {
    const { userId } = query;

    // 1. Fetch all user's organization memberships with their latest license
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            licenses: {
              include: { tariffPlan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Find the best corporate membership:
    // Priority:
    // 1. Membership with an active/higher-tier plan (PRO, ENTERPRISE)
    // 2. Membership where user was invited (role !== 'OWNER')
    // 3. Fall back to first membership
    const corporateMembership =
      memberships.find(
        (m) =>
          m.organization?.licenses?.[0] && m.organization.licenses[0].planType !== PlanType.STARTER,
      ) ||
      memberships.find((m) => m.role !== 'OWNER' && m.organization?.licenses?.[0]) ||
      memberships[0];

    const corporateLicense = corporateMembership?.organization?.licenses?.[0];

    // 2. Fetch personal active license
    const personalLicense = await this.prisma.license.findFirst({
      where: { userId, isActive: true },
      include: {
        tariffPlan: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let license: any = null;

    if (corporateLicense) {
      if (corporateMembership?.role !== 'OWNER') {
        // Team member always uses organization's corporate license
        license = {
          ...corporateLicense,
          organization: corporateMembership.organization,
        };
      } else if (
        personalLicense &&
        personalLicense.organizationId === corporateMembership.organization.id
      ) {
        license = personalLicense;
      } else if (
        !personalLicense ||
        (personalLicense.planType === PlanType.STARTER &&
          corporateLicense.planType !== PlanType.STARTER)
      ) {
        license = {
          ...corporateLicense,
          organization: corporateMembership.organization,
        };
      } else {
        license = personalLicense;
      }
    } else {
      license = personalLicense;
    }

    if (!license) {
      return null;
    }

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
      organizationId: license.organizationId || (license as any).organization?.id || null,
      organizationName: (license as any).organization?.name || null,
      licenseKey: license.licenseKey,
      planType: license.planType as PlanType,
      canCloudBackup: license.canCloudBackup,
      maxXmlLimit: license.maxXmlLimit,
      aiCredits: license.aiCredits,
      maxFeedsLimit: license.maxFeedsLimit,
      maxChannelsLimit: license.maxChannelsLimit,
      maxTeamSeats: license.maxTeamSeats,
      maxSuppliersLimit: license.maxSuppliersLimit ?? 1,
      hasApiAccess: license.hasApiAccess,
      hasFeedDiff: license.hasFeedDiff,
      hasWhiteLabel: license.hasWhiteLabel,
      hasSso: license.hasSso,
      hasAuditLog: license.hasAuditLog,
      isActive: license.isActive,
      expiresAt: license.expiresAt,
      isExpired,
      daysRemaining,
      tariffPlan: license.tariffPlan
        ? {
            id: license.tariffPlan.id,
            code: license.tariffPlan.code,
            nameUk: license.tariffPlan.nameUk,
            nameEn: license.tariffPlan.nameEn,
            descriptionUk: license.tariffPlan.descriptionUk,
            descriptionEn: license.tariffPlan.descriptionEn,
            priceMonthly: Number(license.tariffPlan.priceMonthly),
            priceYearly: license.tariffPlan.priceYearly
              ? Number(license.tariffPlan.priceYearly)
              : null,
            currency: license.tariffPlan.currency,
            maxXmlLimit: license.tariffPlan.maxXmlLimit,
            aiCredits: license.tariffPlan.aiCredits,
            canCloudBackup: license.tariffPlan.canCloudBackup,
            maxFeedsLimit: license.tariffPlan.maxFeedsLimit,
            maxChannelsLimit: license.tariffPlan.maxChannelsLimit,
            maxTeamSeats: license.tariffPlan.maxTeamSeats,
            maxSuppliersLimit: license.tariffPlan.maxSuppliersLimit ?? 1,
            hasApiAccess: license.tariffPlan.hasApiAccess,
            hasFeedDiff: license.tariffPlan.hasFeedDiff,
            isPopular: license.tariffPlan.isPopular,
            isActive: license.tariffPlan.isActive,
            order: license.tariffPlan.order,
            durationDays: license.tariffPlan.durationDays,
            featuresUk: license.tariffPlan.featuresUk,
            featuresEn: license.tariffPlan.featuresEn,
            createdAt: license.tariffPlan.createdAt,
            updatedAt: license.tariffPlan.updatedAt,
          }
        : null,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
    };
  }
}
