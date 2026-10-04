import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UserQuotasDto, QuotaItemDto, PlanType, LicenseEntity } from '@smartfeed/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUsageQuotasQuery } from '@/modules/licenses/queries/get-usage-quotas.query';
import { GetLicenseByUserIdQuery } from '@/modules/licenses/queries/get-license-by-user-id.query';

@Injectable()
@QueryHandler(GetUsageQuotasQuery)
export class GetUsageQuotasHandler implements IQueryHandler<GetUsageQuotasQuery, UserQuotasDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetUsageQuotasQuery): Promise<UserQuotasDto> {
    const { userId } = query;

    // 1. Retrieve active license & plan limits
    const license = await this.queryBus.execute<GetLicenseByUserIdQuery, LicenseEntity | null>(
      new GetLicenseByUserIdQuery(userId),
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMemberships: {
          take: 1,
          orderBy: { joinedAt: 'desc' },
        },
      },
    });

    const organizationId =
      license?.organizationId || user?.organizationMemberships?.[0]?.organizationId || null;

    // 2. Fetch server-side SaaS usage counts: team members & S3 snapshots storage
    const [teamMembersCount, snapshotsAggregate] = await Promise.all([
      organizationId
        ? this.prisma.organizationMember.count({
            where: { organizationId },
          })
        : 1,
      this.prisma.snapshot.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
      }),
    ]);

    const snapshotBytes = Number(snapshotsAggregate._sum.sizeBytes || 0);
    const totalStorageBytes = snapshotBytes;

    const maxSuppliers = license?.maxSuppliersLimit ?? 1;
    const maxProducts = license?.maxXmlLimit ?? 1000;
    const maxFeeds = license?.maxFeedsLimit ?? 1;
    const maxChannels = license?.maxChannelsLimit ?? 1;
    const maxTeamSeats = license?.maxTeamSeats ?? 1;
    const maxAiCredits = license?.aiCredits ?? 50;
    const maxStorageGb = license?.tariffPlan?.maxStorageGb ?? (license?.canCloudBackup ? 2 : 0);
    const maxStorageBytes = maxStorageGb * 1024 * 1024 * 1024;

    const buildQuotaItem = (used: number, max: number): QuotaItemDto => {
      const isUnlimited = max >= 999999;
      const percentUsed = isUnlimited
        ? 0
        : max > 0
          ? Math.min(100, Math.round((used / max) * 100))
          : 0;
      const isExceeded = !isUnlimited && used >= max;
      const remaining = isUnlimited ? 999999 : Math.max(0, max - used);

      return {
        used,
        max,
        isUnlimited,
        percentUsed,
        isExceeded,
        remaining,
      };
    };

    return {
      planCode: license?.planType || PlanType.STARTER,
      planNameUk: license?.tariffPlan?.nameUk || 'Старт',
      planNameEn: license?.tariffPlan?.nameEn || 'Starter',
      isExpired: license?.isExpired ?? false,
      suppliers: buildQuotaItem(0, maxSuppliers),
      products: buildQuotaItem(0, maxProducts),
      feeds: buildQuotaItem(0, maxFeeds),
      channels: buildQuotaItem(0, maxChannels),
      teamSeats: buildQuotaItem(teamMembersCount, maxTeamSeats),
      aiCredits: buildQuotaItem(0, maxAiCredits),
      storage: {
        ...buildQuotaItem(
          Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100,
          maxStorageGb,
        ),
        usedBytes: totalStorageBytes,
        maxBytes: maxStorageBytes,
        canCloudBackup: Boolean(license?.canCloudBackup),
      },
    };
  }
}
