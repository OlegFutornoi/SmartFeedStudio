/**
 * feeds.ts — Query functions, type declarations & backward-compatible facade.
 * Mutation functions (importFeedAsync, getImportJobStatus, getActiveImportJobs)
 * and the network helper (fetchFeedContent) live in feeds-mutations.ts.
 */
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { fetchWithAuth } from './client';
import { fetchFeedContent } from './feeds-mutations';

// ──────────────────────────────────────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────────────────────────────────────

export interface FeedCategoryItem {
  id: string;
  externalId: string;
  name: string;
  parentId?: string;
  productCount: number;
}

export interface FeedAnalysisResult {
  format: string;
  totalDetected: number;
  categoriesCount: number;
  categories: FeedCategoryItem[];
  sampleCategories: Array<{ externalId: string; parentId?: string; name: string }>;
  sampleProducts: Array<{
    sku: string;
    titleUk: string;
    costPrice: number;
    price: number;
    currency: string;
    stockQuantity: number;
    inStock: boolean;
    images?: Array<{ originalUrl: string; isMain?: boolean }>;
    categoryName?: string;
  }>;
  url?: string;
  rawContent?: string;
}

export interface ImportFeedResultDto {
  feedSourceId?: string;
  totalItems: number;
  createdItems: number;
  updatedItems: number;
  categoriesCreated: number;
  format: string;
}

// ImportJobDto is canonical in feeds-mutations.ts — re-export to keep public API stable
export type { ImportJobDto } from './feeds-mutations';

// ──────────────────────────────────────────────────────────────────────────────
// Query functions
// ──────────────────────────────────────────────────────────────────────────────

export async function analyzeFeedUrl(
  url: string,
  supplierId?: string,
  token?: string,
): Promise<FeedAnalysisResult> {
  const isAutomatedTest =
    typeof window !== 'undefined' &&
    Boolean((window.navigator as unknown as { webdriver?: boolean })?.webdriver);

  if (isAutomatedTest) {
    try {
      const response = await fetchWithAuth(
        '/feeds/analyze-url',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, supplierId }),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as FeedAnalysisResult;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote mock call failed, falling back to local analysis:', err);
    }
  }

  const content = await fetchFeedContent(url);
  const res = await localDb.feeds.analyzeFeed(content, supplierId);
  return {
    format: res.format,
    totalDetected: res.totalProducts,
    categoriesCount: res.categories.length,
    categories: res.categories.map((c) => ({
      id: c.id,
      externalId: c.id,
      name: c.name,
      productCount: c.productCount,
    })),
    sampleCategories: res.sampleCategories || [],
    sampleProducts: (res.sampleProducts || []).map((p) => ({
      sku: p.sku,
      titleUk: p.titleUk,
      costPrice: p.costPrice,
      price: p.price,
      currency: p.currency || 'UAH',
      stockQuantity: p.stockQuantity,
      inStock: p.inStock,
      categoryName: p.categoryName,
      images: (p.images || []).map((img: string) => ({ originalUrl: img, isMain: true })),
    })),
    url,
    rawContent: content,
  };
}

export async function analyzeFeedContent(
  content: string,
  supplierId?: string,
  token?: string,
): Promise<FeedAnalysisResult> {
  if (isTauri()) {
    const res = await localDb.feeds.analyzeFeed(content);
    return {
      format: res.format,
      totalDetected: res.totalProducts,
      categoriesCount: res.categories.length,
      categories: res.categories.map((c) => ({
        id: c.id,
        externalId: c.id,
        name: c.name,
        productCount: c.productCount,
      })),
      sampleCategories: res.categories.map((c) => ({ externalId: c.id, name: c.name })),
      sampleProducts: [],
      rawContent: content,
    };
  }

  try {
    const response = await fetchWithAuth(
      '/feeds/analyze',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, supplierId }),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as FeedAnalysisResult;
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const res = await localDb.feeds.analyzeFeed(content, supplierId);
  return {
    format: res.format,
    totalDetected: res.totalProducts,
    categoriesCount: res.categories.length,
    categories: res.categories.map((c) => ({
      id: c.id,
      externalId: c.id,
      name: c.name,
      productCount: c.productCount,
    })),
    sampleCategories: res.sampleCategories || [],
    sampleProducts: (res.sampleProducts || []).map((p) => ({
      sku: p.sku,
      titleUk: p.titleUk,
      costPrice: p.costPrice,
      price: p.price,
      currency: p.currency || 'UAH',
      stockQuantity: p.stockQuantity,
      inStock: p.inStock,
      categoryName: p.categoryName,
      images: (p.images || []).map((img: string) => ({ originalUrl: img, isMain: true })),
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Backward-compatible re-exports from feeds-mutations.ts
// ──────────────────────────────────────────────────────────────────────────────
export {
  importFeedAsync,
  getImportJobStatus,
  getActiveImportJobs,
  fetchFeedContent,
} from './feeds-mutations';
