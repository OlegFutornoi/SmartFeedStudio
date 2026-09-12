import type { MockDbState } from './mock-state';
import { syncCounters } from './mock-state';

export const STORAGE_KEY = 'smartfeed_mock_db';

export function saveMockDbToStorage(state: MockDbState): void {
  if (typeof window === 'undefined') return;
  syncCounters(state);
  try {
    const data = {
      suppliers: state.suppliers,
      pricingRules: Array.from(state.pricingRules.entries()),
      exportChannels: state.exportChannels,
      exportPricingRules: Array.from(state.exportPricingRules.entries()),
      products: state.products,
      feedSources: Array.from(state.feedSources.entries()),
      counters: state.counters,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save mock db to localStorage', err);
  }
}

export function restoreMockDbFromStorage(state: MockDbState, dataStr: string): void {
  try {
    const data = JSON.parse(dataStr);
    if (data.suppliers) state.suppliers = data.suppliers;
    if (data.pricingRules) state.pricingRules = new Map(data.pricingRules);
    if (data.exportChannels) state.exportChannels = data.exportChannels;
    if (data.exportPricingRules) state.exportPricingRules = new Map(data.exportPricingRules);
    if (data.products) state.products = data.products;
    if (data.feedSources) state.feedSources = new Map(data.feedSources);
    if (data.counters) state.counters = data.counters;

    // Always ensure counters are in sync with actual restored data arrays
    syncCounters(state);
  } catch (err) {
    console.warn('Failed to parse mock db from localStorage', err);
  }
}

export const MUTATING_METHODS = [
  'createSupplier',
  'updateSupplier',
  'deleteSupplier',
  'createPricingRule',
  'updatePricingRule',
  'deletePricingRule',
  'createExportChannel',
  'updateExportChannel',
  'deleteExportChannel',
  'createExportPricingRule',
  'deleteExportPricingRule',
  'bulkDeleteProducts',
  'bulkUpsertProducts',
  'reset',
  'seedDefaultData',
  'createFeedSource',
  'deleteFeedSource',
  'deleteProductImage',
  'updateImagesOrder',
  'downloadProductImage',
] as const;

export type MutatingMethodName = (typeof MUTATING_METHODS)[number];

export function attachStorageHooks<T extends { saveToStorage: () => void }>(
  target: T,
  methods: readonly MutatingMethodName[],
): void {
  methods.forEach((method) => {
    const original = (target as unknown as Record<string, (...args: unknown[]) => unknown>)[method];
    if (typeof original === 'function') {
      (target as unknown as Record<string, (...args: unknown[]) => unknown>)[method] = function (
        this: T,
        ...args: unknown[]
      ) {
        const result = original.apply(this, args);
        this.saveToStorage();
        return result;
      };
    }
  });
}
