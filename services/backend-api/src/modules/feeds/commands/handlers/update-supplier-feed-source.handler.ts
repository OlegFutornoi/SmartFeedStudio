// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierFeedSourceCommand } from '@/modules/feeds/commands/update-supplier-feed-source.command';
import type {
  FeedSourceDto,
  FeedSourceType,
  FeedFormat,
  CurrencyCode,
  ExchangeRateMode,
  CustomRoundingRuleDto,
} from '@smartfeed/shared';

@CommandHandler(UpdateSupplierFeedSourceCommand)
export class UpdateSupplierFeedSourceHandler implements ICommandHandler<UpdateSupplierFeedSourceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierFeedSourceCommand): Promise<FeedSourceDto> {
    const { supplierId, sourceId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      select: { id: true, name: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    const current = await this.prisma.supplierFeedSource.findFirst({
      where: { id: sourceId, supplierId },
    });

    if (!current) {
      throw new NotFoundException(`Feed source ${sourceId} not found`);
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.sourceUrl !== undefined) data.sourceUrl = dto.sourceUrl;
    if (dto.canonicalUrl !== undefined) data.canonicalUrl = dto.canonicalUrl;
    if (dto.urlFingerprint !== undefined) data.urlFingerprint = dto.urlFingerprint;
    if (dto.contentHash !== undefined) data.contentHash = dto.contentHash;
    if (dto.parentFeedSourceId !== undefined) data.parentFeedSourceId = dto.parentFeedSourceId;
    if (dto.s3FileKey !== undefined) data.s3FileKey = dto.s3FileKey;
    if (dto.authHeaderName !== undefined) data.authHeaderName = dto.authHeaderName;
    if (dto.authHeaderValue !== undefined) data.authHeaderValue = dto.authHeaderValue;
    if (dto.syncIntervalHours !== undefined) data.syncIntervalHours = dto.syncIntervalHours;
    if (dto.autoUpdatePrices !== undefined) data.autoUpdatePrices = dto.autoUpdatePrices;
    if (dto.autoUpdateStocks !== undefined) data.autoUpdateStocks = dto.autoUpdateStocks;
    if (dto.autoCreateNewProducts !== undefined)
      data.autoCreateNewProducts = dto.autoCreateNewProducts;
    if (dto.baseCurrency !== undefined) data.baseCurrency = dto.baseCurrency;
    if (dto.targetCurrency !== undefined) data.targetCurrency = dto.targetCurrency;
    if (dto.exchangeRateMode !== undefined) data.exchangeRateMode = dto.exchangeRateMode;
    if (dto.exchangeRate !== undefined) data.exchangeRate = dto.exchangeRate;
    if (dto.currencyBufferPercent !== undefined)
      data.currencyBufferPercent = dto.currencyBufferPercent;
    if (dto.priceRounding !== undefined) data.priceRounding = dto.priceRounding;
    if (dto.customRoundingRules !== undefined) {
      data.customRoundingRules = JSON.parse(JSON.stringify(dto.customRoundingRules));
    }
    if (dto.selectedBankId !== undefined) data.selectedBankId = dto.selectedBankId;
    if (dto.mappingRules !== undefined) {
      data.mappingRules = JSON.parse(JSON.stringify(dto.mappingRules));
    }
    if (dto.productsCount !== undefined) data.productsCount = dto.productsCount;
    if (dto.lastSyncedAt !== undefined) {
      data.lastSyncedAt = dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : null;
    }
    if (dto.lastSyncStatus !== undefined) data.lastSyncStatus = dto.lastSyncStatus;

    const updated = await this.prisma.supplierFeedSource.update({
      where: { id: sourceId },
      data,
    });

    return {
      id: updated.id,
      supplierId: updated.supplierId,
      supplierName: supplier.name,
      name: updated.name,
      sourceType: updated.sourceType as FeedSourceType,
      fileFormat: updated.fileFormat as FeedFormat,
      sourceUrl: updated.sourceUrl,
      canonicalUrl: updated.canonicalUrl,
      urlFingerprint: updated.urlFingerprint,
      contentHash: updated.contentHash,
      parentFeedSourceId: updated.parentFeedSourceId,
      s3FileKey: updated.s3FileKey,
      authHeaderName: updated.authHeaderName,
      authHeaderValue: updated.authHeaderValue,
      syncIntervalHours: updated.syncIntervalHours,
      autoUpdatePrices: updated.autoUpdatePrices,
      autoUpdateStocks: updated.autoUpdateStocks,
      autoCreateNewProducts: updated.autoCreateNewProducts,
      baseCurrency: updated.baseCurrency as CurrencyCode,
      targetCurrency: updated.targetCurrency as CurrencyCode,
      exchangeRateMode: updated.exchangeRateMode as ExchangeRateMode,
      exchangeRate: Number(updated.exchangeRate),
      currencyBufferPercent: Number(updated.currencyBufferPercent),
      priceRounding: updated.priceRounding,
      customRoundingRules: Array.isArray(updated.customRoundingRules)
        ? (updated.customRoundingRules as unknown as CustomRoundingRuleDto[])
        : [],
      selectedBankId: updated.selectedBankId ?? null,
      mappingRules: (updated.mappingRules as Record<string, unknown>) ?? null,
      productsCount: updated.productsCount,
      lastSyncedAt: updated.lastSyncedAt ? updated.lastSyncedAt.toISOString() : null,
      lastSyncStatus: updated.lastSyncStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
