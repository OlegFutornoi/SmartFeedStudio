/**
 * Facade re-exporting pricing rule handlers for backward compatibility.
 * Each handler is implemented in its own single-responsibility file (<100 lines) per ARCH-04.
 */
export { CreateSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/create-supplier-pricing-rule.handler';
export { UpdateSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/update-supplier-pricing-rule.handler';
export { DeleteSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/delete-supplier-pricing-rule.handler';
