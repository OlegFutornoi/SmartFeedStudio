import type { FeedSourceDto, CustomRoundingRuleDto } from '@smartfeed/shared';

export interface FeedSourceItemDto {
  id: string;
  supplierId: string;
  name: string;
  sourceType: string;
  fileFormat: string;
  sourceUrl?: string;
  s3FileKey?: string;
  autoUpdatePrices: boolean;
  autoUpdateStocks: boolean;
  baseCurrency?: string;
  targetCurrency?: string;
  exchangeRateMode?: string;
  exchangeRate?: number;
  currencyBufferPercent?: number;
  priceRounding?: string;
  customRoundingRules?: CustomRoundingRuleDto[];
  selectedBankId?: string | null;
  lastSyncedAt?: string | null;
  lastSyncStatus?: string | null;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function mapLocalFeedSource(s: FeedSourceDto): FeedSourceItemDto {
  return {
    id: s.id,
    supplierId: s.supplierId,
    name: s.name,
    sourceType: s.sourceType,
    fileFormat: s.fileFormat || 'XML',
    sourceUrl: s.sourceUrl || undefined,
    autoUpdatePrices: s.autoUpdatePrices ?? true,
    autoUpdateStocks: s.autoUpdateStocks ?? true,
    baseCurrency: s.baseCurrency || 'UAH',
    targetCurrency: s.targetCurrency || 'UAH',
    exchangeRateMode: s.exchangeRateMode || 'MANUAL',
    exchangeRate: s.exchangeRate ?? 1.0,
    currencyBufferPercent: s.currencyBufferPercent ?? 0.0,
    priceRounding: s.priceRounding || 'NONE',
    customRoundingRules: s.customRoundingRules || [],
    selectedBankId: s.selectedBankId ?? null,
    lastSyncedAt: s.lastSyncedAt
      ? typeof s.lastSyncedAt === 'string'
        ? s.lastSyncedAt
        : s.lastSyncedAt.toISOString()
      : null,
    lastSyncStatus: s.lastSyncStatus || 'SUCCESS',
    productsCount: s.productsCount ?? 0,
    createdAt: typeof s.createdAt === 'string' ? s.createdAt : s.createdAt.toISOString(),
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : s.updatedAt.toISOString(),
  };
}
