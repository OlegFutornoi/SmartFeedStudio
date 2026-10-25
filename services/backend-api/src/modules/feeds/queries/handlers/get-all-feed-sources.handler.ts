// @golden - Reference pattern for single-file CQRS Query Handler with tenancy isolation (BE-01, ARCH-04)
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAllFeedSourcesQuery } from '@/modules/feeds/queries/get-all-feed-sources.query';
import type {
  FeedSourceDto,
  FeedSourceType,
  FeedFormat,
  CurrencyCode,
  ExchangeRateMode,
  CustomRoundingRuleDto,
} from '@smartfeed/shared';

@QueryHandler(GetAllFeedSourcesQuery)
export class GetAllFeedSourcesHandler implements IQueryHandler<GetAllFeedSourcesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAllFeedSourcesQuery): Promise<FeedSourceDto[]> {
    const { userId } = query;

    const sources = await this.prisma.supplierFeedSource.findMany({
      where: {
        supplier: {
          userId,
        },
      },
      include: {
        supplier: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sources.map((s) => ({
      id: s.id,
      supplierId: s.supplierId,
      supplierName: s.supplier.name,
      name: s.name,
      sourceType: s.sourceType as FeedSourceType,
      fileFormat: s.fileFormat as FeedFormat,
      sourceUrl: s.sourceUrl,
      canonicalUrl: s.canonicalUrl,
      urlFingerprint: s.urlFingerprint,
      contentHash: s.contentHash,
      parentFeedSourceId: s.parentFeedSourceId,
      s3FileKey: s.s3FileKey,
      authHeaderName: s.authHeaderName,
      authHeaderValue: s.authHeaderValue,
      syncIntervalHours: s.syncIntervalHours,
      autoUpdatePrices: s.autoUpdatePrices,
      autoUpdateStocks: s.autoUpdateStocks,
      autoCreateNewProducts: s.autoCreateNewProducts,
      baseCurrency: s.baseCurrency as CurrencyCode,
      targetCurrency: s.targetCurrency as CurrencyCode,
      exchangeRateMode: s.exchangeRateMode as ExchangeRateMode,
      exchangeRate: Number(s.exchangeRate),
      currencyBufferPercent: Number(s.currencyBufferPercent),
      priceRounding: s.priceRounding,
      customRoundingRules: Array.isArray(s.customRoundingRules)
        ? (s.customRoundingRules as unknown as CustomRoundingRuleDto[])
        : [],
      selectedBankId: s.selectedBankId ?? null,
      mappingRules: (s.mappingRules as Record<string, unknown>) ?? null,
      productsCount: s.productsCount,
      lastSyncedAt: s.lastSyncedAt ? s.lastSyncedAt.toISOString() : null,
      lastSyncStatus: s.lastSyncStatus,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }
}
