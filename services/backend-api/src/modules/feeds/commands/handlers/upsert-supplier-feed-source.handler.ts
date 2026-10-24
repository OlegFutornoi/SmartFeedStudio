// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpsertSupplierFeedSourceCommand } from '@/modules/feeds/commands/upsert-supplier-feed-source.command';
import type { FeedSourceDto, FeedSourceType, FeedFormat } from '@smartfeed/shared';

@CommandHandler(UpsertSupplierFeedSourceCommand)
export class UpsertSupplierFeedSourceHandler implements ICommandHandler<UpsertSupplierFeedSourceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpsertSupplierFeedSourceCommand): Promise<FeedSourceDto> {
    const { supplierId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true, name: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const source = await this.prisma.$transaction(async (tx) => {
      let existing = null;
      if (dto.urlFingerprint) {
        existing = await tx.supplierFeedSource.findFirst({
          where: { supplierId, urlFingerprint: dto.urlFingerprint },
        });
      }

      if (existing) {
        return tx.supplierFeedSource.update({
          where: { id: existing.id },
          data: {
            name: dto.name,
            sourceType: dto.sourceType ?? existing.sourceType,
            fileFormat: dto.fileFormat ?? existing.fileFormat,
            sourceUrl: dto.sourceUrl ?? existing.sourceUrl,
            canonicalUrl: dto.canonicalUrl ?? existing.canonicalUrl,
            contentHash: dto.contentHash ?? existing.contentHash,
            parentFeedSourceId: dto.parentFeedSourceId ?? existing.parentFeedSourceId,
            s3FileKey: dto.s3FileKey ?? existing.s3FileKey,
            authHeaderName: dto.authHeaderName ?? existing.authHeaderName,
            authHeaderValue: dto.authHeaderValue ?? existing.authHeaderValue,
            syncIntervalHours: dto.syncIntervalHours ?? existing.syncIntervalHours,
            autoUpdatePrices: dto.autoUpdatePrices ?? existing.autoUpdatePrices,
            autoUpdateStocks: dto.autoUpdateStocks ?? existing.autoUpdateStocks,
            autoCreateNewProducts: dto.autoCreateNewProducts ?? existing.autoCreateNewProducts,
            mappingRules: dto.mappingRules
              ? JSON.parse(JSON.stringify(dto.mappingRules))
              : existing.mappingRules,
            productsCount: dto.productsCount ?? existing.productsCount,
          },
        });
      }

      return tx.supplierFeedSource.create({
        data: {
          supplierId,
          name: dto.name,
          sourceType: dto.sourceType ?? 'URL',
          fileFormat: dto.fileFormat ?? 'XML_ROZETKA',
          sourceUrl: dto.sourceUrl,
          canonicalUrl: dto.canonicalUrl,
          urlFingerprint: dto.urlFingerprint,
          contentHash: dto.contentHash,
          parentFeedSourceId: dto.parentFeedSourceId,
          s3FileKey: dto.s3FileKey,
          authHeaderName: dto.authHeaderName,
          authHeaderValue: dto.authHeaderValue,
          syncIntervalHours: dto.syncIntervalHours ?? 0,
          autoUpdatePrices: dto.autoUpdatePrices ?? true,
          autoUpdateStocks: dto.autoUpdateStocks ?? true,
          autoCreateNewProducts: dto.autoCreateNewProducts ?? true,
          mappingRules: dto.mappingRules ? JSON.parse(JSON.stringify(dto.mappingRules)) : undefined,
          productsCount: dto.productsCount ?? 0,
        },
      });
    });

    return {
      id: source.id,
      supplierId: source.supplierId,
      supplierName: supplier.name,
      name: source.name,
      sourceType: source.sourceType as FeedSourceType,
      fileFormat: source.fileFormat as FeedFormat,
      sourceUrl: source.sourceUrl,
      canonicalUrl: source.canonicalUrl,
      urlFingerprint: source.urlFingerprint,
      contentHash: source.contentHash,
      parentFeedSourceId: source.parentFeedSourceId,
      s3FileKey: source.s3FileKey,
      authHeaderName: source.authHeaderName,
      authHeaderValue: source.authHeaderValue,
      syncIntervalHours: source.syncIntervalHours,
      autoUpdatePrices: source.autoUpdatePrices,
      autoUpdateStocks: source.autoUpdateStocks,
      autoCreateNewProducts: source.autoCreateNewProducts,
      mappingRules: (source.mappingRules as Record<string, unknown>) ?? null,
      productsCount: source.productsCount,
      lastSyncedAt: source.lastSyncedAt ? source.lastSyncedAt.toISOString() : null,
      lastSyncStatus: source.lastSyncStatus,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };
  }
}
