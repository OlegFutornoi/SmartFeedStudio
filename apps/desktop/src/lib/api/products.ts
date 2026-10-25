import type {
  ProductDto,
  UserQuotasDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
  ProductCategorySummaryDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
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
  _token?: string,
): Promise<{ items: ProductDto[]; total: number; page: number; pageSize: number }> {
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
  _token: string,
  dto: BulkDeleteProductsDto,
): Promise<BulkDeleteResultDto> {
  return localDb.products.bulkDeleteProducts(dto);
}

export async function getCategoriesSummary(_token?: string): Promise<ProductCategorySummaryDto[]> {
  return localDb.products.getCategoriesSummary();
}
