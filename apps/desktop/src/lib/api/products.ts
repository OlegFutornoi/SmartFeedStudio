import type {
  ProductDto,
  UserQuotasDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
  ProductCategorySummaryDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { fetchWithAuth } from '@/lib/api/client';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  [key: string]: unknown;
}

export async function getProducts(
  params?: GetProductsParams,
  token?: string,
): Promise<{ items: ProductDto[]; total: number; page: number; pageSize: number }> {
  if (isTauri()) {
    const res = await localDb.products.getProducts(params || {});
    return {
      items: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.limit,
    };
  }

  try {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    const response = await fetchWithAuth(`/products${query}`, { method: 'GET' }, token);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const res = await localDb.products.getProducts(params || {});
  return {
    items: res.items,
    total: res.total,
    page: res.page,
    pageSize: res.limit,
  };
}

export async function getUserQuotas(token?: string): Promise<UserQuotasDto | null> {
  const response = await fetchWithAuth('/licenses/quotas', { method: 'GET' }, token);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return null;
  }
  return data as UserQuotasDto;
}

export async function bulkDeleteProducts(
  token: string,
  dto: BulkDeleteProductsDto,
): Promise<BulkDeleteResultDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/products/bulk-delete',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as BulkDeleteResultDto;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.products.bulkDeleteProducts(dto);
}

export async function getCategoriesSummary(token?: string): Promise<ProductCategorySummaryDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/products/categories-summary',
        { method: 'GET' },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ProductCategorySummaryDto[];
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }
  return localDb.products.getCategoriesSummary();
}
