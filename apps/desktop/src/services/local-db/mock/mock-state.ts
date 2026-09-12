import type {
  SupplierDto,
  SupplierPricingRuleDto,
  ExportChannelDto,
  ExportChannelPricingRuleDto,
  ProductDto,
  FeedSourceDto,
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
  exportChannels: ExportChannelDto[];
  exportPricingRules: Map<string, ExportChannelPricingRuleDto[]>;
  products: ProductDto[];
  feedSources: Map<string, FeedSourceDto[]>;
  counters: MockDbCounters;
}

export function createInitialState(): MockDbState {
  return {
    suppliers: [],
    pricingRules: new Map(),
    exportChannels: [],
    exportPricingRules: new Map(),
    products: [],
    feedSources: new Map(),
    counters: {
      id: 'main',
      suppliersCount: 0,
      feedsCount: 0,
      productsCount: 0,
    },
  };
}

export function syncCounters(state: MockDbState): void {
  let feedsCount = 0;
  for (const sources of state.feedSources.values()) {
    feedsCount += sources.length;
  }
  state.counters.suppliersCount = state.suppliers.length;
  state.counters.productsCount = state.products.length;
  state.counters.feedsCount = feedsCount;
}
