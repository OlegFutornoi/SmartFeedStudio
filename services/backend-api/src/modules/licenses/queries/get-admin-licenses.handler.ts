import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetAdminLicensesQuery } from './get-admin-licenses.query';

@Injectable()
@QueryHandler(GetAdminLicensesQuery)
export class GetAdminLicensesHandler implements IQueryHandler<
  GetAdminLicensesQuery,
  AdminLicenseItemDto[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAdminLicensesQuery): Promise<AdminLicenseItemDto[]> {
    const { search, limit = 50, offset = 0 } = query;

    const andConditions: Prisma.LicenseWhereInput[] = [{ user: { role: { not: 'SUPER_ADMIN' } } }];

    if (search && search.trim() !== '') {
      const term = search.trim();
      andConditions.push({
        OR: [
          { licenseKey: { contains: term, mode: 'insensitive' } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          { user: { fullName: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.LicenseWhereInput = { AND: andConditions };

    const licenses = await this.prisma.license.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        tariffPlan: {
          select: {
            id: true,
            nameUk: true,
            nameEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return licenses.map((lic) => ({
      id: lic.id,
      userId: lic.userId,
      licenseKey: lic.licenseKey,
      planType: lic.planType,
      tariffPlanId: lic.tariffPlanId,
      tariffPlanNameUk: lic.tariffPlan?.nameUk || null,
      tariffPlanNameEn: lic.tariffPlan?.nameEn || null,
      canCloudBackup: lic.canCloudBackup,
      maxXmlLimit: lic.maxXmlLimit,
      aiCredits: lic.aiCredits,
      maxFeedsLimit: lic.maxFeedsLimit,
      maxChannelsLimit: lic.maxChannelsLimit,
      maxTeamSeats: lic.maxTeamSeats,
      maxSuppliersLimit: lic.maxSuppliersLimit ?? 1,
      hasApiAccess: lic.hasApiAccess,
      hasFeedDiff: lic.hasFeedDiff,
      hasWhiteLabel: lic.hasWhiteLabel,
      hasSso: lic.hasSso,
      hasAuditLog: lic.hasAuditLog,
      isActive: lic.isActive,
      expiresAt: lic.expiresAt,
      createdAt: lic.createdAt,
      user: {
        id: lic.user.id,
        email: lic.user.email,
        fullName: lic.user.fullName,
        role: lic.user.role,
      },
    }));
  }
}
