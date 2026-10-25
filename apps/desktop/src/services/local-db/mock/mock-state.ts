import {
  type SupplierDto,
  type SupplierPricingRuleDto,
  type ExportChannelDto,
  type ExportChannelPricingRuleDto,
  type ProductDto,
  type FeedSourceDto,
  type SupplierCategoryRuleDto,
  type MarketplaceCategoryDto,
  type LocalSupplierCategoryMarketplaceMapDto,
  type SupplierSyncSettingDto,
  type SupplierSyncLogDto,
  type LiveBankRateDto,
  SEED_MARKETPLACE_CATEGORIES,
} from '@smartfeed/shared';

export interface MockDbCounters {
  id: string;
  suppliersCount: number;
  feedsCount: number;
  productsCount: number;
}

export interface MockDbState {
  suppliers: SupplierDto[];
  pricingRules: Map<string, SupplierPricingRuleDto[]>;
  supplierCategories: Map<string, SupplierCategoryRuleDto[]>;
  marketplaceCategories: MarketplaceCategoryDto[];
  supplierCategoryMarketplaceMaps: Map<string, LocalSupplierCategoryMarketplaceMapDto[]>;
  syncSettings: Map<string, SupplierSyncSettingDto>;
  syncLogs: Map<string, SupplierSyncLogDto[]>;
  exportChannels: ExportChannelDto[];
  exportPricingRules: Map<string, ExportChannelPricingRuleDto[]>;
  products: ProductDto[];
  feedSources: Map<string, FeedSourceDto[]>;
  bankRates: Map<string, LiveBankRateDto>;
  counters: MockDbCounters;
}

export function createInitialState(): MockDbState {
  return {
    suppliers: [],
    pricingRules: new Map(),
    supplierCategories: new Map(),
    marketplaceCategories: [...SEED_MARKETPLACE_CATEGORIES],
    supplierCategoryMarketplaceMaps: new Map(),
    syncSettings: new Map(),
    syncLogs: new Map(),
    exportChannels: [],
    exportPricingRules: new Map(),
    products: [],
    feedSources: new Map(),
    bankRates: new Map(),
    counters: {
      id: 'main',
      suppliersCount: 0,
      feedsCount: 0,
      productsCount: 0,
    },
  };
}

export function syncCounters(state: MockDbState): void {
  // DB-REF-02 & FEED-DEDUP-01: Prune feeds belonging to non-existent suppliers and deduplicate
  for (const [supplierId, sources] of Array.from(state.feedSources.entries())) {
    if (!supplierId || !state.suppliers.some((s) => s.id === supplierId)) {
      state.feedSources.delete(supplierId);
      continue;
    }
    const seen = new Set<string>();
    const uniqueSources = sources.filter((f) => {
      const key = `${f.sourceUrl || ''}::${f.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    state.feedSources.set(supplierId, uniqueSources);
  }

  // DB-REF-01: "Нема постачальника / нема фіда — нема товарів"
  // Prune any orphan products without valid supplier or active feed
  state.products = state.products.filter((p) => {
    if (!p.supplierId || !p.feedSourceId) return false;
    const supExists = state.suppliers.some((s) => s.id === p.supplierId);
    if (!supExists) return false;
    const feeds = state.feedSources.get(p.supplierId) || [];
    return feeds.some((f) => f.id === p.feedSourceId);
  });

  // DB-REF-03: "Нема постачальника / нема фіда — нема категорій"
  // Prune any orphan categories without valid supplier or active feed
  for (const [supplierId, cats] of Array.from(state.supplierCategories.entries())) {
    if (!supplierId || !state.suppliers.some((s) => s.id === supplierId)) {
      state.supplierCategories.delete(supplierId);
      continue;
    }
    const feeds = state.feedSources.get(supplierId) || [];
    if (feeds.length === 0) {
      state.supplierCategories.delete(supplierId);
      continue;
    }
    const activeFeedIds = new Set(feeds.map((f) => f.id));
    const validCats = cats.filter((c) => !c.feedSourceId || activeFeedIds.has(c.feedSourceId));
    if (validCats.length === 0) {
      state.supplierCategories.delete(supplierId);
    } else {
      state.supplierCategories.set(supplierId, validCats);
    }
  }

  let feedsCount = 0;
  for (const sources of state.feedSources.values()) {
    feedsCount += sources.length;
  }

  for (const s of state.suppliers) {
    const supFeeds = state.feedSources.get(s.id) || [];
    const supProducts =
      supFeeds.length === 0 ? [] : state.products.filter((p) => p.supplierId === s.id);
    const supCats =
      supFeeds.length === 0 || supProducts.length === 0
        ? []
        : state.supplierCategories.get(s.id) || [];
    s.activeFeedsCount = supFeeds.length;
    s.productsCount = supProducts.length;
    s.categoriesCount = supCats.length;
    s.activeCategoriesCount = supCats.filter((c) => c.isActive).length;
  }

  state.counters.suppliersCount = state.suppliers.length;
  state.counters.productsCount = state.products.length;
  state.counters.feedsCount = feedsCount;
}
