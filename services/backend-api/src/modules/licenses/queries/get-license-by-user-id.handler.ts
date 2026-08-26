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
    let license = await this.prisma.license.findFirst({
      where: { userId, isActive: true },
      include: {
        tariffPlan: true,
        organization: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      // Check if user is a member of an organization with an active corporate license
      const membership = await this.prisma.organizationMember.findFirst({
        where: { userId },
        include: {
          organization: {
            include: {
              licenses: {
                where: { isActive: true },
                include: { tariffPlan: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (membership?.organization?.licenses?.[0]) {
        const orgLicense = membership.organization.licenses[0];
        license = {
          ...orgLicense,
          organization: membership.organization,
        } as typeof license;
      }
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
