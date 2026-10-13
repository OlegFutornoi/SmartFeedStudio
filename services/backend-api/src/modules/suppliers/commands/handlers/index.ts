import { CreateSupplierHandler } from '@/modules/suppliers/commands/handlers/create-supplier.handler';
import { UpdateSupplierHandler } from '@/modules/suppliers/commands/handlers/update-supplier.handler';
import { DeleteSupplierHandler } from '@/modules/suppliers/commands/handlers/delete-supplier.handler';
import { UpdateSupplierCategoryHandler } from '@/modules/suppliers/commands/handlers/update-supplier-category.handler';
import {
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
} from '@/modules/suppliers/commands/handlers/supplier-pricing-rules.handlers';

export {
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  UpdateSupplierCategoryHandler,
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
};

export const SupplierCommandHandlers = [
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  UpdateSupplierCategoryHandler,
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
];
