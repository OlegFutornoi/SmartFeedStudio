import {
  CreateSupplierDto,
  UpdateSupplierDto,
  UpdateSupplierCategoryDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
} from '@/modules/suppliers/dto/supplier.dto';

export class CreateSupplierCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateSupplierDto,
    public readonly organizationId?: string,
  ) {}
}

export class UpdateSupplierCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateSupplierDto,
  ) {}
}

export class DeleteSupplierCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}

export class UpdateSupplierCategoryCommand {
  constructor(
    public readonly supplierId: string,
    public readonly categoryId: string,
    public readonly userId: string,
    public readonly dto: UpdateSupplierCategoryDto,
  ) {}
}

export class CreateSupplierPricingRuleCommand {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
    public readonly dto: CreateSupplierPricingRuleDto,
  ) {}
}

export class UpdateSupplierPricingRuleCommand {
  constructor(
    public readonly supplierId: string,
    public readonly ruleId: string,
    public readonly userId: string,
    public readonly dto: UpdateSupplierPricingRuleDto,
  ) {}
}

export class DeleteSupplierPricingRuleCommand {
  constructor(
    public readonly supplierId: string,
    public readonly ruleId: string,
    public readonly userId: string,
  ) {}
}

export class UpdateSupplierSyncSettingsCommand {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
    public readonly dto: import('../dto/supplier-sync.dto').UpdateSupplierSyncSettingDto,
  ) {}
}

export class SyncSupplierFeedCommand {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
    public readonly dto: import('../dto/supplier-sync.dto').TriggerSupplierSyncDto,
  ) {}
}
