// @golden - Reference pattern for single-file CQRS Query Handler with tenancy isolation (BE-01, ARCH-04)
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSupplierFeedSourcesQuery } from '@/modules/feeds/queries/get-supplier-feed-sources.query';
import type { FeedSourceDto, FeedSourceType, FeedFormat } from '@smartfeed/shared';

@QueryHandler(GetSupplierFeedSourcesQuery)
export class GetSupplierFeedSourcesHandler implements IQueryHandler<GetSupplierFeedSourcesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierFeedSourcesQuery): Promise<FeedSourceDto[]> {
    const { supplierId, userId } = query;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true, name: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const sources = await this.prisma.supplierFeedSource.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });

    return sources.map((s) => ({
      id: s.id,
      supplierId: s.supplierId,
      supplierName: supplier.name,
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
      mappingRules: (s.mappingRules as Record<string, unknown>) ?? null,
      productsCount: s.productsCount,
      lastSyncedAt: s.lastSyncedAt ? s.lastSyncedAt.toISOString() : null,
      lastSyncStatus: s.lastSyncStatus,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }
}
