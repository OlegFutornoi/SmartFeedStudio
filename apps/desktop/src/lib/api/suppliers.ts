import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { ApiError, fetchWithAuth } from '@/lib/api/client';
import { appCounterService } from '@/services/counters';
import { SMARTFEED_DATA_SYNC_EVENT } from '@/lib/syncEvents';

let cachedSuppliers: { [key: string]: { data: SupplierDto[]; timestamp: number } } = {};
const SUPPLIERS_TTL_MS = 30000; // 30s navigation TTL per FE-14

export function invalidateSuppliersCache(): void {
  cachedSuppliers = {};
}

if (typeof window !== 'undefined') {
  window.addEventListener(SMARTFEED_DATA_SYNC_EVENT, () => {
    invalidateSuppliersCache();
  });
}

export async function getSuppliers(
  token?: string,
  search?: string,
  force = false,
): Promise<SupplierDto[]> {
  if (isTauri()) {
    const localSuppliers = await localDb.suppliers.getSuppliers(search);
    return appCounterService.hydrateSuppliers(localSuppliers, force);
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
        const hydrated = await appCounterService.hydrateSuppliers(data, force);
        cachedSuppliers[cacheKey] = { data: hydrated, timestamp: Date.now() };
        return hydrated;
      }
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const fallback = await localDb.suppliers.getSuppliers(search);
  return appCounterService.hydrateSuppliers(fallback, force);
}

export async function getSupplierById(id: string, token?: string): Promise<SupplierDto> {
  const hydrateOne = async (s: SupplierDto): Promise<SupplierDto> => {
    const [hydrated] = await appCounterService.hydrateSuppliers([s]);
    return hydrated || s;
  };

  if (isTauri()) {
    const supplier = await localDb.suppliers.getSupplierById(id);
    if (supplier) return hydrateOne(supplier);
    throw new ApiError('Supplier not found', 404);
  }

  try {
    const response = await fetchWithAuth(`/suppliers/${id}`, { method: 'GET' }, token);
    if (response.ok) {
      const data = await response.json();
      if (data?.id) return hydrateOne(data as SupplierDto);
    }
  } catch (err) {
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const supplier = await localDb.suppliers.getSupplierById(id);
  if (!supplier) {
    throw new ApiError('Supplier not found', 404);
  }
  return hydrateOne(supplier);
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
    const errData = await response.json().catch(() => ({}));
    const message = Array.isArray(errData?.message)
      ? errData.message.join(', ')
      : errData?.message || `Failed to create supplier (${response.status})`;
    throw new ApiError(message, response.status, errData);
  } catch (err) {
    if (err instanceof ApiError) throw err;
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
    if (response.status === 404) {
      try {
        return localDb.suppliers.updateSupplier(id, payload);
      } catch {
        // Fall through to error throwing below
      }
    }
    const errData = await response.json().catch(() => ({}));
    const message = Array.isArray(errData?.message)
      ? errData.message.join(', ')
      : errData?.message || `Failed to update supplier (${response.status})`;
    throw new ApiError(message, response.status, errData);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    return localDb.suppliers.updateSupplier(id, payload);
  }
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
    if (response.status === 404) {
      try {
        const success = await localDb.suppliers.deleteSupplier(id);
        return { success };
      } catch {
        // Fall through
      }
    }
    const errData = await response.json().catch(() => ({}));
    const message = errData?.message || `Failed to delete supplier (${response.status})`;
    throw new ApiError(message, response.status, errData);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn('[ApiClient] Remote call failed, using local fallback:', err);
  }

  const success = await localDb.suppliers.deleteSupplier(id);
  return { success };
}

export * from '@/lib/api/supplier-categories';
