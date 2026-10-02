import type { MockDbState } from './mock-state';
import { syncCounters } from './mock-state';

export const LEGACY_STORAGE_KEY = 'smartfeed_mock_db';
export const STORAGE_PREFIX = 'smartfeed_mock_db_';
export const STORAGE_KEY = LEGACY_STORAGE_KEY;

export function getCurrentStorageUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage?.getItem('smartfeed_user_profile');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
}

export function getStorageKey(userId?: string | null): string {
  const resolvedId = userId !== undefined ? userId : getCurrentStorageUserId();
  return resolvedId ? `${STORAGE_PREFIX}${resolvedId}` : `${STORAGE_PREFIX}guest`;
}

export function clearLegacyMockDbStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveMockDbToStorage(state: MockDbState, userId?: string | null): void {
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
    const key = getStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(data));
    clearLegacyMockDbStorage();
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
