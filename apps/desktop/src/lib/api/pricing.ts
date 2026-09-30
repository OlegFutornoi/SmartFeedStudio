import type {
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
  ExportChannelPricingRuleDto,
  CreateExportChannelPricingRuleDto,
  PriceSimulationRequestDto,
  PriceSimulationResultDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { ApiError, fetchWithAuth } from './client';

export async function getSupplierPricingRules(
  supplierId: string,
  token?: string,
): Promise<SupplierPricingRuleDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules`,
        { method: 'GET' },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto[];
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.pricing.getPricingRules(supplierId);
}

export async function createSupplierPricingRule(
  supplierId: string,
  dto: CreateSupplierPricingRuleDto,
  token?: string,
): Promise<SupplierPricingRuleDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.pricing.createPricingRule(supplierId, dto);
}

export async function updateSupplierPricingRule(
  supplierId: string,
  ruleId: string,
  dto: UpdateSupplierPricingRuleDto,
  token?: string,
): Promise<SupplierPricingRuleDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules/${ruleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.pricing.updatePricingRule(supplierId, ruleId, dto);
}

export async function deleteSupplierPricingRule(
  supplierId: string,
  ruleId: string,
  token?: string,
): Promise<{ success: boolean }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules/${ruleId}`,
        { method: 'DELETE' },
        token,
      );
      if (response.ok) {
        return { success: true };
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  const success = await localDb.pricing.deletePricingRule(supplierId, ruleId);
  return { success };
}

export async function getExportChannels(
  params?: { search?: string; isActive?: boolean },
  token?: string,
): Promise<ExportChannelDto[]> {
  if (!isTauri()) {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
      const url = `/export/channels${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await fetchWithAuth(url, { method: 'GET' }, token);
      if (response.ok) {
        return (await response.json()) as ExportChannelDto[];
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.export.getExportChannels();
}

export async function getExportChannelById(
  id: string,
  token?: string,
): Promise<ExportChannelDto & { pricingRules: ExportChannelPricingRuleDto[] }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(`/export/channels/${id}`, { method: 'GET' }, token);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  const channel = await localDb.export.getExportChannelById(id);
  if (!channel) {
    throw new ApiError('Export channel not found', 404);
  }
  const pricingRules = await localDb.export.getExportPricingRules(id);
  return {
    ...channel,
    pricingRules,
  };
}

export async function createExportChannel(
  dto: CreateExportChannelDto,
  token?: string,
): Promise<ExportChannelDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/export/channels',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ExportChannelDto;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.export.createExportChannel(dto);
}

export async function updateExportChannel(
  id: string,
  dto: UpdateExportChannelDto,
  token?: string,
): Promise<ExportChannelDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/export/channels/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ExportChannelDto;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.export.updateExportChannel(id, dto);
}

export async function deleteExportChannel(
  id: string,
  token?: string,
): Promise<{ success: boolean }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(`/export/channels/${id}`, { method: 'DELETE' }, token);
      if (response.ok) {
        return { success: true };
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  const success = await localDb.export.deleteExportChannel(id);
  return { success };
}

export async function createExportChannelRule(
  channelId: string,
  dto: CreateExportChannelPricingRuleDto,
  token?: string,
): Promise<ExportChannelPricingRuleDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/export/channels/${channelId}/rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ExportChannelPricingRuleDto;
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  return localDb.export.createExportPricingRule(channelId, dto);
}

export async function deleteExportChannelRule(
  channelId: string,
  ruleId: string,
  token?: string,
): Promise<{ success: boolean }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/export/channels/${channelId}/rules/${ruleId}`,
        { method: 'DELETE' },
        token,
      );
      if (response.ok) {
        return { success: true };
      }
    } catch (err) {
      console.warn('[ApiClient] Remote call failed, using local fallback:', err);
    }
  }

  const success = await localDb.export.deleteExportPricingRule(channelId, ruleId);
  return { success };
}

export async function simulatePricing(
  dto: PriceSimulationRequestDto,
): Promise<PriceSimulationResultDto> {
  return localDb.export.simulatePrice(dto);
}
