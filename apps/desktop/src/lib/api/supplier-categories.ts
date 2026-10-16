import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { fetchWithAuth } from '@/lib/api/client';

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
