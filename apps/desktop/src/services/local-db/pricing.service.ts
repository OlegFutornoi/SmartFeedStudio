import type {
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from './client';

export class LocalPricingService {
  async getPricingRules(supplierId: string): Promise<SupplierPricingRuleDto[]> {
    return invokeLocalDb('db_get_pricing_rules', { supplierId });
  }

  async createPricingRule(
    supplierId: string,
    payload: CreateSupplierPricingRuleDto,
  ): Promise<SupplierPricingRuleDto> {
    return invokeLocalDb('db_create_pricing_rule', { supplierId, payload });
  }

  async updatePricingRule(
    supplierId: string,
    ruleId: string,
    payload: UpdateSupplierPricingRuleDto,
  ): Promise<SupplierPricingRuleDto> {
    return invokeLocalDb('db_update_pricing_rule', { supplierId, ruleId, payload });
  }

  async deletePricingRule(supplierId: string, ruleId: string): Promise<boolean> {
    return invokeLocalDb('db_delete_pricing_rule', { supplierId, ruleId });
  }
}

export const localPricingService = new LocalPricingService();
