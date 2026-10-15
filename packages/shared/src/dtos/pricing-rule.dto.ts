import { z } from 'zod';
import { FeedFormat } from '../enums';

// ---------------------------------------------------------------------------
// Supplier Pricing Rule DTOs
// ---------------------------------------------------------------------------

export const SupplierPricingRuleDtoSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  categoryId: z.string().nullable().optional(),
  categoryNameUk: z.string().nullable().optional(),
  categoryNameEn: z.string().nullable().optional(),
  minPrice: z.number().nullable().optional(),
  maxPrice: z.number().nullable().optional(),
  marginPercent: z.number().default(0),
  fixedMarkup: z.number().default(0),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type SupplierPricingRuleDto = z.infer<typeof SupplierPricingRuleDtoSchema>;

export const CreateSupplierPricingRuleDtoSchema = z.object({
  categoryId: z.string().nullable().optional(),
  minPrice: z.number().min(0, 'Minimum price must be non-negative').nullable().optional(),
  maxPrice: z.number().min(0, 'Maximum price must be non-negative').nullable().optional(),
  marginPercent: z.number().min(0, 'Margin percent must be non-negative').default(0),
  fixedMarkup: z.number().min(0, 'Fixed markup must be non-negative').default(0),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true).optional(),
});

export type CreateSupplierPricingRuleDto = z.infer<typeof CreateSupplierPricingRuleDtoSchema>;

export const UpdateSupplierPricingRuleDtoSchema = CreateSupplierPricingRuleDtoSchema.partial();

export type UpdateSupplierPricingRuleDto = z.infer<typeof UpdateSupplierPricingRuleDtoSchema>;

// ---------------------------------------------------------------------------
// Export Channel DTOs
// ---------------------------------------------------------------------------

export const ExportChannelDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable().optional(),
  userId: z.string(),
  name: z.string().min(1, 'Channel name is required'),
  marketplaceCode: z.string().default('ROZETKA'),
  feedFormat: z.nativeEnum(FeedFormat).default(FeedFormat.XML_ROZETKA),
  commissionPercent: z.number().min(0).max(99).default(0),
  extraFixedCost: z.number().min(0).default(0),
  applyReverseMarkup: z.boolean().default(true),
  slug: z.string(),
  isActive: z.boolean().default(true),
  catalogId: z.string().nullable().optional(),
  catalogName: z.string().nullable().optional(),
  lastExportedAt: z.union([z.date(), z.string()]).nullable().optional(),
  totalProductsCount: z.number().int().nonnegative().default(0),
  pricingRulesCount: z.number().int().nonnegative().optional(),
  exportUrl: z.string().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ExportChannelDto = z.infer<typeof ExportChannelDtoSchema>;

export const CreateExportChannelDtoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  marketplaceCode: z.string().default('ROZETKA'),
  feedFormat: z.nativeEnum(FeedFormat).default(FeedFormat.XML_ROZETKA),
  commissionPercent: z.number().min(0).max(99).default(0),
  extraFixedCost: z.number().min(0).default(0),
  applyReverseMarkup: z.boolean().default(true).optional(),
  catalogId: z.string().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export type CreateExportChannelDto = z.infer<typeof CreateExportChannelDtoSchema>;

export const UpdateExportChannelDtoSchema = CreateExportChannelDtoSchema.partial();

export type UpdateExportChannelDto = z.infer<typeof UpdateExportChannelDtoSchema>;

// ---------------------------------------------------------------------------
// Export Channel Pricing Rule DTOs
// ---------------------------------------------------------------------------

export const ExportChannelPricingRuleDtoSchema = z.object({
  id: z.string(),
  exportChannelId: z.string(),
  categoryId: z.string().nullable().optional(),
  categoryNameUk: z.string().nullable().optional(),
  minPrice: z.number().nullable().optional(),
  maxPrice: z.number().nullable().optional(),
  commissionPercent: z.number().nullable().optional(),
  marginPercent: z.number().nullable().optional(),
  fixedMarkup: z.number().nullable().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ExportChannelPricingRuleDto = z.infer<typeof ExportChannelPricingRuleDtoSchema>;

export const CreateExportChannelPricingRuleDtoSchema = z.object({
  categoryId: z.string().nullable().optional(),
  minPrice: z.number().min(0).nullable().optional(),
  maxPrice: z.number().min(0).nullable().optional(),
  commissionPercent: z.number().min(0).max(99).nullable().optional(),
  marginPercent: z.number().min(0).nullable().optional(),
  fixedMarkup: z.number().min(0).nullable().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true).optional(),
});

export type CreateExportChannelPricingRuleDto = z.infer<
  typeof CreateExportChannelPricingRuleDtoSchema
>;

// ---------------------------------------------------------------------------
// Simulation DTOs
// ---------------------------------------------------------------------------

export const PriceSimulationRequestDtoSchema = z.object({
  costPrice: z.number().min(0, 'Cost price must be positive'),
  supplierMarginPercent: z.number().min(0).default(0),
  supplierFixedMarkup: z.number().min(0).default(0),
  marketplaceCommissionPercent: z.number().min(0).max(99).default(15),
  marketplaceExtraFixedCost: z.number().min(0).default(0),
  applyReverseMarkup: z.boolean().default(true),
});

export type PriceSimulationRequestDto = z.infer<typeof PriceSimulationRequestDtoSchema>;

export const PriceSimulationResultDtoSchema = z.object({
  costPrice: z.number(),
  basePrice: z.number(),
  supplierMarkupProfit: z.number(),
  shelfPrice: z.number(),
  commissionAmount: z.number(),
  extraFixedCost: z.number(),
  payoutAmount: z.number(),
  netProfit: z.number(),
  netMarginPercent: z.number(),
  returnOnSalesPercent: z.number(),
});

export type PriceSimulationResultDto = z.infer<typeof PriceSimulationResultDtoSchema>;
