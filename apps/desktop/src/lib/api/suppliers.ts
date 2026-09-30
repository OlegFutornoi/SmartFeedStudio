import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { ApiError, fetchWithAuth } from './client';

export async function getSuppliers(token?: string, search?: string): Promise<SupplierDto[]> {
  if (isTauri()) {
    return localDb.suppliers.getSuppliers(search);
  }

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithAuth(`/suppliers${query}`, { method: 'GET' }, token);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
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
