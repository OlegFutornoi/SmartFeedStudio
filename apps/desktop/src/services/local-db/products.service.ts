import type {
  ProductDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from '@/services/local-db/client';
import { localSuppliersService } from '@/services/local-db/suppliers.service';

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
    const raw = (await invokeLocalDb('db_get_products', params)) as unknown;

    // Handle Tauri native return: Vec<ProductDto> (plain array)
    if (Array.isArray(raw)) {
      let filtered = [...(raw as ProductDto[])];

      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.titleUk?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.categoryNameUk?.toLowerCase().includes(q),
        );
      }

      if (params.category) {
        filtered = filtered.filter(
          (p) => p.categoryNameUk === params.category || p.categoryId === params.category,
        );
      }

      if (params.supplierId) {
        filtered = filtered.filter((p) => p.supplierId === params.supplierId);
      }

      if (params.minPrice !== undefined) {
        filtered = filtered.filter((p) => (p.price ?? 0) >= params.minPrice!);
      }

      if (params.maxPrice !== undefined) {
        filtered = filtered.filter((p) => (p.price ?? 0) <= params.maxPrice!);
      }

      if (params.inStockOnly) {
        filtered = filtered.filter((p) => Boolean(p.inStock));
      }

      const page = Math.max(1, params.page || 1);
      const limit = Math.max(1, params.limit || 10);
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (page - 1) * limit;
      const items = filtered.slice(startIndex, startIndex + limit);

      await this.hydrateSuppliers(items);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
      };
    }

    // Handle structured object (e.g. from mock driver)
    const obj = (raw || {}) as Partial<{
      items: ProductDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>;

    const items = Array.isArray(obj.items) ? obj.items : [];
    const total = typeof obj.total === 'number' ? obj.total : items.length;
    const page = typeof obj.page === 'number' ? obj.page : Math.max(1, params.page || 1);
    const limit = typeof obj.limit === 'number' ? obj.limit : Math.max(1, params.limit || 10);
    const totalPages =
      typeof obj.totalPages === 'number' ? obj.totalPages : Math.max(1, Math.ceil(total / limit));

    await this.hydrateSuppliers(items);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  private async hydrateSuppliers(items: ProductDto[]): Promise<void> {
    if (!items.length) return;
    try {
      const sups = await localSuppliersService.getSuppliers();
      if (!Array.isArray(sups) || !sups.length) return;
      const supMap = new Map(sups.map((s) => [s.id, s]));
      for (const item of items) {
        const sup = supMap.get(item.supplierId) || (sups.length === 1 ? sups[0] : undefined);
        if (sup) {
          if (!item.supplierName || item.supplierName === 'Постачальник') {
            item.supplierName = sup.name;
          }
          if (!item.supplierCode) {
            item.supplierCode = sup.code;
          }
        }
      }
    } catch (e) {
      console.warn('[LocalProductsService:hydrateSuppliers] Failed to hydrate suppliers:', e);
    }
  }

  async getCategoriesSummary(supplierId?: string): Promise<ProductCategorySummaryDto[]> {
    try {
      const res = await invokeLocalDb('db_get_categories_summary', { supplierId });
      if (Array.isArray(res) && res.length > 0) return res;

      // Fallback: derive categories from local products
      const productsRes = await this.getProducts({ supplierId, limit: 10000 });
      const map = new Map<string, { id: string; count: number }>();
      for (const p of productsRes.items) {
        const name = p.categoryNameUk || 'Без категорії';
        const entry = map.get(name) || { id: p.categoryId || 'cat_none', count: 0 };
        entry.count += 1;
        map.set(name, entry);
      }
      return Array.from(map.entries()).map(([nameUk, data]) => ({
        id: data.id,
        nameUk,
        productCount: data.count,
      }));
    } catch (err) {
      console.warn('[LocalProductsService:getCategoriesSummary] Error:', err);
      return [];
    }
  }

  async bulkDeleteProducts(payload: BulkDeleteProductsDto): Promise<BulkDeleteResultDto> {
    return invokeLocalDb('db_bulk_delete_products', { payload });
  }

  async bulkUpsert(products: ProductDto[]): Promise<{ count: number }> {
    return invokeLocalDb('db_bulk_upsert_products', { products });
  }
}

export const localProductsService = new LocalProductsService();
