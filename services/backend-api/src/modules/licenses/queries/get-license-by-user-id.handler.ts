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
    const license = await this.prisma.license.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      return null;
    }

    return {
      id: license.id,
      userId: license.userId,
      licenseKey: license.licenseKey,
      planType: license.planType as PlanType,
      canCloudBackup: license.canCloudBackup,
      maxXmlLimit: license.maxXmlLimit,
      aiCredits: license.aiCredits,
      isActive: license.isActive,
      expiresAt: license.expiresAt,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
    };
  }
}
