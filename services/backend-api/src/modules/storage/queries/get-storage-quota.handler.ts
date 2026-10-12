import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetStorageQuotaQuery } from '@/modules/storage/queries/get-storage-quota.query';
import { StorageQuotaDto } from '@smartfeed/shared';

@Injectable()
@QueryHandler(GetStorageQuotaQuery)
export class GetStorageQuotaHandler implements IQueryHandler<
  GetStorageQuotaQuery,
  StorageQuotaDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetStorageQuotaQuery): Promise<StorageQuotaDto> {
    const { userId } = query;

    const license = await this.prisma.license.findFirst({
      where: { userId, isActive: true },
      include: { tariffPlan: true },
    });

    const rawLicenseStorage = license?.maxStorageGb ? Number(license.maxStorageGb) : 0;
    const rawPlanStorage = license?.tariffPlan?.maxStorageGb
      ? Number(license.tariffPlan.maxStorageGb)
      : 0;
    const maxStorageGb = rawLicenseStorage > 0 ? rawLicenseStorage : rawPlanStorage;
    const maxStorageBytes = maxStorageGb * 1024 * 1024 * 1024;
    const usedStorageBytes = Number(license?.usedStorageBytes ?? 0);
    const availableBytes = Math.max(0, maxStorageBytes - usedStorageBytes);
    const usedPercentage =
      maxStorageBytes > 0
        ? Math.min(100, Math.round((usedStorageBytes / maxStorageBytes) * 100))
        : 0;

    const totalFilesCount = await this.prisma.storageFile.count({
      where: { userId, status: 'ACTIVE' },
    });

    const canCloudStorage = Boolean(
      license?.canCloudBackup ?? license?.tariffPlan?.canCloudBackup ?? false,
    );

    return {
      canCloudStorage,
      maxStorageGb,
      usedStorageBytes,
      availableBytes,
      usedPercentage,
      totalFilesCount,
      planType: license?.planType || 'STARTER',
    };
  }
}
