import type {
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { appCounterService } from '@/services/counters';

export * from '@/lib/api/export-channels';

export async function getSupplierPricingRules(
  supplierId: string,
  _token?: string,
): Promise<SupplierPricingRuleDto[]> {
  return localDb.pricing.getPricingRules(supplierId);
}

export async function createSupplierPricingRule(
  supplierId: string,
  dto: CreateSupplierPricingRuleDto,
  _token?: string,
): Promise<SupplierPricingRuleDto> {
  appCounterService.invalidate();
  return localDb.pricing.createPricingRule(supplierId, dto);
}

export async function bulkCreateSupplierPricingRules(
  supplierId: string,
  rules: CreateSupplierPricingRuleDto[],
  _replaceExisting = false,
  _token?: string,
): Promise<SupplierPricingRuleDto[]> {
  appCounterService.invalidate();
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
  _token?: string,
): Promise<SupplierPricingRuleDto> {
  appCounterService.invalidate();
  return localDb.pricing.updatePricingRule(supplierId, ruleId, dto);
}

export async function deleteSupplierPricingRule(
  supplierId: string,
  ruleId: string,
  _token?: string,
): Promise<{ success: boolean }> {
  appCounterService.invalidate();
  const success = await localDb.pricing.deletePricingRule(supplierId, ruleId);
  return { success };
}
