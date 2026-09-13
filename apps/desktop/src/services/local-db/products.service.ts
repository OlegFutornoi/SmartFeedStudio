import type {
  ProductDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from './client';

export class LocalProductsService {
  async getProducts(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      supplierId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
    } = {},
  ): Promise<{
    items: ProductDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return invokeLocalDb('db_get_products', params);
  }

  async getCategoriesSummary(supplierId?: string): Promise<ProductCategorySummaryDto[]> {
    return invokeLocalDb('db_get_categories_summary', { supplierId });
  }

  async bulkDeleteProducts(payload: BulkDeleteProductsDto): Promise<BulkDeleteResultDto> {
    return invokeLocalDb('db_bulk_delete_products', { payload });
  }

  async bulkUpsert(products: ProductDto[]): Promise<{ count: number }> {
    return invokeLocalDb('db_bulk_upsert_products', { products });
  }
}

export const localProductsService = new LocalProductsService();
