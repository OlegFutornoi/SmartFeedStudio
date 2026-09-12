import type {
  ProductDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
} from '@smartfeed/shared';
import type { MockDbState } from './mock-state';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export function getProducts(
  state: MockDbState,
  params: GetProductsParams,
): {
  items: ProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  let filtered = [...state.products];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.titleUk.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
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
    filtered = filtered.filter((p) => p.price >= params.minPrice!);
  }

  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= params.maxPrice!);
  }

  if (params.inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 50);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

export function getCategoriesSummary(
  state: MockDbState,
  supplierId?: string,
): ProductCategorySummaryDto[] {
  let pool = state.products;
  if (supplierId) {
    pool = pool.filter((p) => p.supplierId === supplierId);
  }

  const map = new Map<string, { id: string; count: number }>();
  for (const p of pool) {
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
}

export function bulkDeleteProducts(
  state: MockDbState,
  payload: BulkDeleteProductsDto,
): BulkDeleteResultDto {
  const initialCount = state.products.length;

  if (payload.supplierIds && payload.supplierIds.length > 0) {
    const set = new Set(payload.supplierIds);
    state.products = state.products.filter((p) => !set.has(p.supplierId));
  } else if (payload.categoryIds && payload.categoryIds.length > 0) {
    const set = new Set(payload.categoryIds);
    state.products = state.products.filter((p) => !p.categoryId || !set.has(p.categoryId));
  } else if (payload.productIds && payload.productIds.length > 0) {
    const set = new Set(payload.productIds);
    state.products = state.products.filter((p) => !set.has(p.id));
  }

  const deletedCount = initialCount - state.products.length;
  return {
    deletedCount,
    remainingCount: state.products.length,
    message: `Успішно видалено ${deletedCount} товарів`,
  };
}

export function bulkUpsertProducts(state: MockDbState, products: ProductDto[]): { count: number } {
  const existingMap = new Map<string, number>();
  state.products.forEach((p, idx) => {
    existingMap.set(`${p.supplierId}_${p.sku}`, idx);
  });

  for (const newProd of products) {
    const key = `${newProd.supplierId}_${newProd.sku}`;
    const existingIndex = existingMap.get(key);
    if (existingIndex !== undefined) {
      state.products[existingIndex] = {
        ...state.products[existingIndex],
        ...newProd,
        updatedAt: new Date().toISOString(),
      };
    } else {
      state.products.push(newProd);
      existingMap.set(key, state.products.length - 1);
    }
  }

  // Update supplier product counts
  const countsBySupplier = new Map<string, number>();
  for (const p of state.products) {
    countsBySupplier.set(p.supplierId, (countsBySupplier.get(p.supplierId) || 0) + 1);
  }
  for (const s of state.suppliers) {
    if (countsBySupplier.has(s.id)) {
      s.productsCount = countsBySupplier.get(s.id)!;
    }
  }

  return { count: products.length };
}
