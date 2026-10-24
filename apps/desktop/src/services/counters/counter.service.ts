import type { SupplierDto } from '@smartfeed/shared';
import type { LocalCountersSummary } from '@/services/local-db/types';
import { localDb } from '@/services/local-db';
import { SMARTFEED_DATA_SYNC_EVENT } from '@/lib/syncEvents';

export interface AppCountersState extends LocalCountersSummary {
  totalCategories: number;
  categoriesBySupplierId: Record<string, number>;
  activeCategoriesBySupplierId: Record<string, number>;
  lastUpdated: number;
  isLoading: boolean;
}

const DEFAULT_COUNTERS_STATE: AppCountersState = {
  totalSuppliers: 0,
  totalFeeds: 0,
  totalProducts: 0,
  totalRules: 0,
  totalCategories: 0,
  feedsBySupplierId: {},
  productsBySupplierId: {},
  categoriesBySupplierId: {},
  activeCategoriesBySupplierId: {},
  lastUpdated: 0,
  isLoading: false,
};

export class AppCounterService {
  private state: AppCountersState = { ...DEFAULT_COUNTERS_STATE };
  private listeners = new Set<() => void>();
  private inFlightPromise: Promise<AppCountersState> | null = null;
  private cacheTtlMs = 5000;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener(SMARTFEED_DATA_SYNC_EVENT, () => {
        this.invalidate();
      });
    }
  }

  public getSnapshot = (): AppCountersState => {
    return this.state;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.warn('[AppCounterService] Listener notification error:', err);
      }
    }
  }

  public async fetchSummary(force = false): Promise<AppCountersState> {
    const now = Date.now();
    if (!force && this.state.lastUpdated > 0 && now - this.state.lastUpdated < this.cacheTtlMs) {
      return this.state;
    }

    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = (async () => {
      try {
        if (!this.state.isLoading) {
          this.state = { ...this.state, isLoading: true };
          this.notify();
        }

        const summary = await localDb.counters.getCountersSummary();

        this.state = {
          totalSuppliers: summary?.totalSuppliers ?? 0,
          totalFeeds: summary?.totalFeeds ?? 0,
          totalProducts: summary?.totalProducts ?? 0,
          totalRules: summary?.totalRules ?? 0,
          totalCategories: summary?.totalCategories ?? 0,
          feedsBySupplierId: summary?.feedsBySupplierId ?? {},
          productsBySupplierId: summary?.productsBySupplierId ?? {},
          categoriesBySupplierId: summary?.categoriesBySupplierId ?? {},
          activeCategoriesBySupplierId: summary?.activeCategoriesBySupplierId ?? {},
          lastUpdated: Date.now(),
          isLoading: false,
        };
      } catch (err) {
        console.warn('[AppCounterService] Failed to load counters summary:', err);
        this.state = {
          ...this.state,
          isLoading: false,
          lastUpdated: Date.now(),
        };
      } finally {
        this.inFlightPromise = null;
        this.notify();
      }
      return this.state;
    })();

    return this.inFlightPromise;
  }

  public getSupplierFeedsCount(supplierId: string): number {
    return this.state.feedsBySupplierId[supplierId] ?? 0;
  }

  public getSupplierProductsCount(supplierId: string): number {
    return this.state.productsBySupplierId[supplierId] ?? 0;
  }

  public getSupplierCategoriesCount(supplierId: string): number {
    return this.state.categoriesBySupplierId[supplierId] ?? 0;
  }

  public getSupplierActiveCategoriesCount(supplierId: string): number {
    return this.state.activeCategoriesBySupplierId[supplierId] ?? 0;
  }

  public invalidate(): void {
    this.state.lastUpdated = 0;
  }

  public async hydrateSuppliers(suppliers: SupplierDto[], force = false): Promise<SupplierDto[]> {
    if (!suppliers || suppliers.length === 0) return [];
    const summary = await this.fetchSummary(force);

    return suppliers.map((s) => {
      const activeFeedsCount = summary.feedsBySupplierId[s.id] ?? s.activeFeedsCount ?? 0;
      const rawProductsCount = summary.productsBySupplierId[s.id] ?? s.productsCount ?? 0;
      const productsCount = activeFeedsCount === 0 ? 0 : rawProductsCount;
      const hasNoFeedsOrProducts = activeFeedsCount === 0 || productsCount === 0;
      const categoriesCount = hasNoFeedsOrProducts
        ? 0
        : (summary.categoriesBySupplierId?.[s.id] ?? s.categoriesCount ?? 0);
      const activeCategoriesCount = hasNoFeedsOrProducts
        ? 0
        : (summary.activeCategoriesBySupplierId?.[s.id] ??
          s.activeCategoriesCount ??
          categoriesCount);

      return {
        ...s,
        activeFeedsCount,
        productsCount,
        categoriesCount,
        activeCategoriesCount,
      };
    });
  }
}

export const appCounterService = new AppCounterService();
