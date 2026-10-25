import { CreateSupplierHandler } from '@/modules/suppliers/commands/handlers/create-supplier.handler';
import { UpdateSupplierHandler } from '@/modules/suppliers/commands/handlers/update-supplier.handler';
import { DeleteSupplierHandler } from '@/modules/suppliers/commands/handlers/delete-supplier.handler';
import { UpdateSupplierCategoryHandler } from '@/modules/suppliers/commands/handlers/update-supplier-category.handler';
import { ToggleSupplierCategoryHandler } from '@/modules/suppliers/commands/handlers/toggle-supplier-category.handler';
import { BatchToggleSupplierCategoriesHandler } from '@/modules/suppliers/commands/handlers/batch-toggle-supplier-categories.handler';
import { BulkUpsertSupplierCategoriesHandler } from '@/modules/suppliers/commands/handlers/bulk-upsert-supplier-categories.handler';
import { DeleteSupplierCategoryHandler } from '@/modules/suppliers/commands/handlers/delete-supplier-category.handler';
import { CreateSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/create-supplier-pricing-rule.handler';
import { UpdateSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/update-supplier-pricing-rule.handler';
import { DeleteSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/delete-supplier-pricing-rule.handler';
import { BulkCreateSupplierPricingRulesHandler } from '@/modules/suppliers/commands/handlers/bulk-create-supplier-pricing-rules.handler';

export {
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  UpdateSupplierCategoryHandler,
  ToggleSupplierCategoryHandler,
  BatchToggleSupplierCategoriesHandler,
  BulkUpsertSupplierCategoriesHandler,
  DeleteSupplierCategoryHandler,
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
  BulkCreateSupplierPricingRulesHandler,
};

export const SupplierCommandHandlers = [
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  UpdateSupplierCategoryHandler,
  ToggleSupplierCategoryHandler,
  BatchToggleSupplierCategoriesHandler,
  BulkUpsertSupplierCategoriesHandler,
  DeleteSupplierCategoryHandler,
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
  BulkCreateSupplierPricingRulesHandler,
];
