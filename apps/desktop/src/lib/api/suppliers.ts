import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { ApiError } from '@/lib/api/client';
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
  _token?: string,
  search?: string,
  force = false,
): Promise<SupplierDto[]> {
  const cacheKey = search || '__all__';
  const now = Date.now();
  if (
    !force &&
    cachedSuppliers[cacheKey] &&
    now - cachedSuppliers[cacheKey].timestamp < SUPPLIERS_TTL_MS
  ) {
    return cachedSuppliers[cacheKey].data;
  }

  const localSuppliers = await localDb.suppliers.getSuppliers(search);
  const hydrated = await appCounterService.hydrateSuppliers(localSuppliers, force);
  cachedSuppliers[cacheKey] = { data: hydrated, timestamp: Date.now() };
  return hydrated;
}

export async function getSupplierById(id: string, _token?: string): Promise<SupplierDto> {
  const hydrateOne = async (s: SupplierDto): Promise<SupplierDto> => {
    const [hydrated] = await appCounterService.hydrateSuppliers([s]);
    return hydrated || s;
  };

  const supplier = await localDb.suppliers.getSupplierById(id);
  if (!supplier) {
    throw new ApiError('Supplier not found', 404);
  }
  return hydrateOne(supplier);
}

export async function createSupplier(
  payload: CreateSupplierDto,
  _token?: string,
): Promise<SupplierDto> {
  invalidateSuppliersCache();
  return localDb.suppliers.createSupplier(payload);
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierDto,
  _token?: string,
): Promise<SupplierDto> {
  invalidateSuppliersCache();
  return localDb.suppliers.updateSupplier(id, payload);
}

export async function deleteSupplier(id: string, _token?: string): Promise<{ success: boolean }> {
  invalidateSuppliersCache();
  const success = await localDb.suppliers.deleteSupplier(id);
  return { success };
}

export * from '@/lib/api/supplier-categories';
