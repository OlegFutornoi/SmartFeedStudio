import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { ApiError, fetchWithAuth } from '@/lib/api/client';

let cachedSuppliers: { [key: string]: { data: SupplierDto[]; timestamp: number } } = {};
const SUPPLIERS_TTL_MS = 30000; // 30s navigation TTL per FE-14

export function invalidateSuppliersCache(): void {
  cachedSuppliers = {};
}

export async function getSuppliers(
  token?: string,
  search?: string,
  force = false,
): Promise<SupplierDto[]> {
  if (isTauri()) {
    return localDb.suppliers.getSuppliers(search);
  }

  const cacheKey = `${token || 'anon'}:${search || ''}`;
  const now = Date.now();
  if (
    !force &&
    cachedSuppliers[cacheKey] &&
    now - cachedSuppliers[cacheKey].timestamp < SUPPLIERS_TTL_MS
  ) {
    return cachedSuppliers[cacheKey].data;
  }

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithAuth(`/suppliers${query}`, { method: 'GET' }, token);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        cachedSuppliers[cacheKey] = { data, timestamp: Date.now() };
        return data;
      }
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  return localDb.suppliers.getSuppliers(search);
}

export async function getSupplierById(id: string, token?: string): Promise<SupplierDto> {
  if (isTauri()) {
    const supplier = await localDb.suppliers.getSupplierById(id);
    if (supplier) return supplier;
    throw new ApiError('Supplier not found', 404);
  }

  try {
    const response = await fetchWithAuth(`/suppliers/${id}`, { method: 'GET' }, token);
    if (response.ok) {
      const data = await response.json();
      if (data?.id) return data as SupplierDto;
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const supplier = await localDb.suppliers.getSupplierById(id);
  if (!supplier) {
    throw new ApiError('Supplier not found', 404);
  }
  return supplier;
}

export async function createSupplier(
  payload: CreateSupplierDto,
  token?: string,
): Promise<SupplierDto> {
  invalidateSuppliersCache();
  if (isTauri()) {
    return localDb.suppliers.createSupplier(payload);
  }

  try {
    const response = await fetchWithAuth(
      '/suppliers',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as SupplierDto;
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  return localDb.suppliers.createSupplier(payload);
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierDto,
  token?: string,
): Promise<SupplierDto> {
  invalidateSuppliersCache();
  if (isTauri()) {
    return localDb.suppliers.updateSupplier(id, payload);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as SupplierDto;
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  return localDb.suppliers.updateSupplier(id, payload);
}

export async function deleteSupplier(id: string, token?: string): Promise<{ success: boolean }> {
  invalidateSuppliersCache();
  if (isTauri()) {
    const success = await localDb.suppliers.deleteSupplier(id);
    return { success };
  }

  try {
    const response = await fetchWithAuth(`/suppliers/${id}`, { method: 'DELETE' }, token);
    if (response.ok) {
      return (await response.json()) as { success: boolean };
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const success = await localDb.suppliers.deleteSupplier(id);
  return { success };
}

export async function getSupplierCategories(supplierId: string, token?: string, search?: string) {
  if (isTauri()) {
    return localDb.suppliers.getSupplierCategories(supplierId, search);
  }

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories${query}`,
      { method: 'GET' },
      token,
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('[ApiClient] Remote getSupplierCategories failed, using local fallback:', err);
  }

  return localDb.suppliers.getSupplierCategories(supplierId, search);
}

export async function toggleSupplierCategory(
  supplierId: string,
  categoryId: string,
  isActive: boolean,
  token?: string,
) {
  if (isTauri()) {
    return localDb.suppliers.toggleSupplierCategory(supplierId, categoryId, isActive);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories/${categoryId}/toggle`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      },
      token,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[ApiClient] Remote toggleSupplierCategory failed, using local fallback:', err);
  }

  return localDb.suppliers.toggleSupplierCategory(supplierId, categoryId, isActive);
}

export async function batchToggleSupplierCategories(
  supplierId: string,
  categoryIds: string[],
  isActive: boolean,
  token?: string,
) {
  if (isTauri()) {
    return localDb.suppliers.batchToggleSupplierCategories(supplierId, categoryIds, isActive);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories/batch-toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds, isActive }),
      },
      token,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(
      '[ApiClient] Remote batchToggleSupplierCategories failed, using local fallback:',
      err,
    );
  }

  return localDb.suppliers.batchToggleSupplierCategories(supplierId, categoryIds, isActive);
}

export async function updateSupplierCategoryRule(
  supplierId: string,
  categoryId: string,
  payload: { marginPercent?: number | null; fixedMarkup?: number | null },
  token?: string,
) {
  if (isTauri()) {
    return localDb.suppliers.updateSupplierCategoryRule(
      supplierId,
      categoryId,
      payload.marginPercent,
      payload.fixedMarkup,
    );
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${supplierId}/categories/${categoryId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(
      '[ApiClient] Remote updateSupplierCategoryRule failed, using local fallback:',
      err,
    );
  }

  return localDb.suppliers.updateSupplierCategoryRule(
    supplierId,
    categoryId,
    payload.marginPercent,
    payload.fixedMarkup,
  );
}
