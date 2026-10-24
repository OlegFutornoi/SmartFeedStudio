import type {
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { isTauri } from '@/lib/runtime';
import { fetchWithAuth } from '@/lib/api/client';
import { appCounterService } from '@/services/counters';

export * from '@/lib/api/export-channels';

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
  appCounterService.invalidate();
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

export async function bulkCreateSupplierPricingRules(
  supplierId: string,
  rules: CreateSupplierPricingRuleDto[],
  replaceExisting = false,
  token?: string,
): Promise<SupplierPricingRuleDto[]> {
  appCounterService.invalidate();
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules, replaceExisting }),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto[];
      }
    } catch (err) {
      console.warn('[ApiClient] Remote bulk pricing rules failed:', err);
    }
  }

  const created: SupplierPricingRuleDto[] = [];
  for (const r of rules) {
    const item = await localDb.pricing.createPricingRule(supplierId, r);
    created.push(item);
  }
  return created;
}

export async function updateSupplierPricingRule(
  supplierId: string,
  ruleId: string,
  dto: UpdateSupplierPricingRuleDto,
  token?: string,
): Promise<SupplierPricingRuleDto> {
  appCounterService.invalidate();
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
  appCounterService.invalidate();
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
