import { CreateSupplierHandler } from '@/modules/suppliers/commands/handlers/create-supplier.handler';
import { UpdateSupplierHandler } from '@/modules/suppliers/commands/handlers/update-supplier.handler';
import { DeleteSupplierHandler } from '@/modules/suppliers/commands/handlers/delete-supplier.handler';
import { UpdateSupplierCategoryHandler } from '@/modules/suppliers/commands/handlers/update-supplier-category.handler';
import { CreateSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/create-supplier-pricing-rule.handler';
import { UpdateSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/update-supplier-pricing-rule.handler';
import { DeleteSupplierPricingRuleHandler } from '@/modules/suppliers/commands/handlers/delete-supplier-pricing-rule.handler';
import { UpdateSupplierSyncSettingsHandler } from '@/modules/suppliers/commands/handlers/update-supplier-sync-settings.handler';
import { SyncSupplierFeedHandler } from '@/modules/suppliers/commands/handlers/sync-supplier-feed.handler';

export {
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  UpdateSupplierCategoryHandler,
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
  UpdateSupplierSyncSettingsHandler,
  SyncSupplierFeedHandler,
};

export const SupplierCommandHandlers = [
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  UpdateSupplierCategoryHandler,
  CreateSupplierPricingRuleHandler,
  UpdateSupplierPricingRuleHandler,
  DeleteSupplierPricingRuleHandler,
  UpdateSupplierSyncSettingsHandler,
  SyncSupplierFeedHandler,
];
