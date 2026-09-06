// Central API Facade: modular sub-APIs for SmartFeed Studio desktop client

export * from './client';
export * from './auth';
export * from './licenses';
export * from './organizations';
export * from './suppliers';
export * from './feeds';
export * from './feed-sources';
export * from './products';
export * from './pricing';

// Re-export common shared contracts for seamless backwards compatibility
export type {
  AuthResponseDto,
  UserProfile,
  Role,
  NavigationItemDto,
  CheckoutResponseDto,
  OrganizationMemberDto,
  OrganizationDto,
  UserOrganizationDto,
  OrganizationInvitationDto,
  LicenseEntity,
  TariffPlanDto,
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  ProductDto,
  UserQuotasDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
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
