// @golden - Reference pattern for single-file CQRS Command Handler with tenancy isolation (BE-01, ARCH-04)
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpsertSupplierFeedSourceCommand } from '@/modules/feeds/commands/upsert-supplier-feed-source.command';
import type {
  FeedSourceDto,
  FeedSourceType,
  FeedFormat,
  CurrencyCode,
  ExchangeRateMode,
  CustomRoundingRuleDto,
} from '@smartfeed/shared';
import { encryptSecret, decryptSecret } from '@/common/utils/crypto.util';

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
            authHeaderValue:
              dto.authHeaderValue !== undefined
                ? encryptSecret(dto.authHeaderValue)
                : existing.authHeaderValue,
            syncIntervalHours: dto.syncIntervalHours ?? existing.syncIntervalHours,
            autoUpdatePrices: dto.autoUpdatePrices ?? existing.autoUpdatePrices,
            autoUpdateStocks: dto.autoUpdateStocks ?? existing.autoUpdateStocks,
            autoCreateNewProducts: dto.autoCreateNewProducts ?? existing.autoCreateNewProducts,
            baseCurrency: dto.baseCurrency ?? existing.baseCurrency,
            targetCurrency: dto.targetCurrency ?? existing.targetCurrency,
            exchangeRateMode: dto.exchangeRateMode ?? existing.exchangeRateMode,
            exchangeRate: dto.exchangeRate ?? existing.exchangeRate,
            currencyBufferPercent: dto.currencyBufferPercent ?? existing.currencyBufferPercent,
            priceRounding: dto.priceRounding ?? existing.priceRounding,
            customRoundingRules: dto.customRoundingRules
              ? JSON.parse(JSON.stringify(dto.customRoundingRules))
              : existing.customRoundingRules,
            selectedBankId:
              dto.selectedBankId !== undefined ? dto.selectedBankId : existing.selectedBankId,
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
          authHeaderValue: encryptSecret(dto.authHeaderValue),
          syncIntervalHours: dto.syncIntervalHours ?? 0,
          autoUpdatePrices: dto.autoUpdatePrices ?? true,
          autoUpdateStocks: dto.autoUpdateStocks ?? true,
          autoCreateNewProducts: dto.autoCreateNewProducts ?? true,
          baseCurrency: dto.baseCurrency ?? 'UAH',
          targetCurrency: dto.targetCurrency ?? 'UAH',
          exchangeRateMode: dto.exchangeRateMode ?? 'MANUAL',
          exchangeRate: dto.exchangeRate ?? 1.0,
          currencyBufferPercent: dto.currencyBufferPercent ?? 0,
          priceRounding: dto.priceRounding ?? 'NONE',
          customRoundingRules: JSON.parse(JSON.stringify(dto.customRoundingRules ?? [])),
          selectedBankId: dto.selectedBankId ?? null,
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
      authHeaderValue: decryptSecret(source.authHeaderValue),
      syncIntervalHours: source.syncIntervalHours,
      autoUpdatePrices: source.autoUpdatePrices,
      autoUpdateStocks: source.autoUpdateStocks,
      autoCreateNewProducts: source.autoCreateNewProducts,
      baseCurrency: source.baseCurrency as CurrencyCode,
      targetCurrency: source.targetCurrency as CurrencyCode,
      exchangeRateMode: source.exchangeRateMode as ExchangeRateMode,
      exchangeRate: Number(source.exchangeRate),
      currencyBufferPercent: Number(source.currencyBufferPercent),
      priceRounding: source.priceRounding,
      customRoundingRules: Array.isArray(source.customRoundingRules)
        ? (source.customRoundingRules as unknown as CustomRoundingRuleDto[])
        : [],
      selectedBankId: source.selectedBankId ?? null,
      mappingRules: (source.mappingRules as Record<string, unknown>) ?? null,
      productsCount: source.productsCount,
      lastSyncedAt: source.lastSyncedAt ? source.lastSyncedAt.toISOString() : null,
      lastSyncStatus: source.lastSyncStatus,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };
  }
}
