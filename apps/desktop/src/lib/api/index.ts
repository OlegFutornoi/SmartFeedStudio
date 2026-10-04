// Central API Facade: modular sub-APIs for SmartFeed Studio desktop client

export * from '@/lib/api/client';
export * from '@/lib/api/auth';
export * from '@/lib/api/licenses';
export * from '@/lib/api/organizations';
export * from '@/lib/api/suppliers';
export * from '@/lib/api/feeds';
export * from '@/lib/api/feed-sources';
export * from '@/lib/api/products';
export * from '@/lib/api/pricing';

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
