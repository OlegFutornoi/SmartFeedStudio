/**
 * reconciliationCalculator.ts — Pure quota/projection calculation utilities
 * for the Quota Reconciliation dialog.
 */
import type { ProductCategorySummaryDto } from '@smartfeed/shared';

export interface ReconciliationQuotaState {
  currentProductsUsed: number;
  maxProductsLimit: number;
  currentFeedsUsed: number;
  maxFeedsLimit: number;
}

export function buildQuotaState(
  quotas: {
    products?: { used: number; max: number } | null;
    feeds?: { used: number; max: number } | null;
  } | null,
): ReconciliationQuotaState {
  return {
    currentProductsUsed: quotas?.products?.used ?? 0,
    maxProductsLimit: quotas?.products?.max ?? 1000,
    currentFeedsUsed: quotas?.feeds?.used ?? 0,
    maxFeedsLimit: quotas?.feeds?.max ?? 1,
  };
}

export function computeSelectedProductsCount(
  categories: ProductCategorySummaryDto[],
  selectedIds: string[],
): number {
  return categories
    .filter((c) => selectedIds.includes(c.id))
    .reduce((acc, c) => acc + c.productCount, 0);
}

export function computeProjectedRemaining(
  currentUsed: number,
  selectedDeleteCount: number,
): number {
  return Math.max(0, currentUsed - selectedDeleteCount);
}

export function filterCategories(
  categories: ProductCategorySummaryDto[],
  search: string,
): ProductCategorySummaryDto[] {
  if (!search.trim()) return categories;
  const q = search.toLowerCase().trim();
  return categories.filter(
    (c) =>
      c.nameUk.toLowerCase().includes(q) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
      (c.supplierName && c.supplierName.toLowerCase().includes(q)),
  );
}
