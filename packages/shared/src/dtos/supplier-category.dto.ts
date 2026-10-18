import { z } from 'zod';

export const MarketplaceCategoryDtoSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  marketplaceCode: z.string().default('ROZETKA'),
  externalId: z.string().min(1, 'External marketplace category ID is required'),
  xmlAttributeName: z.string().default('rz_id'),
  nameUk: z.string().min(1, 'Category name (UK) is required'),
  nameEn: z.string().nullable().optional(),
  fullPathUk: z.string().nullable().optional(),
  parentExternalId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  defaultCommissionPercent: z.number().min(0).max(99).default(0),
  defaultFixedFee: z.number().min(0).default(0),
  isLeaf: z.boolean().default(true),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export type MarketplaceCategoryDto = z.infer<typeof MarketplaceCategoryDtoSchema>;

export const LocalSupplierCategoryMarketplaceMapDtoSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  supplierCategoryRuleId: z.string(),
  marketplaceCode: z.string().default('ROZETKA'),
  marketplaceCategoryId: z.string().nullable().optional(),
  externalCategoryId: z.string(),
  externalCategoryName: z.string(),
  commissionPercent: z.number().min(0).max(99).default(0),
  fixedFee: z.number().min(0).default(0),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export type LocalSupplierCategoryMarketplaceMapDto = z.infer<
  typeof LocalSupplierCategoryMarketplaceMapDtoSchema
>;

export const CreateMarketplaceCategoryDtoSchema = z.object({
  marketplaceCode: z.string().default('ROZETKA'),
  externalId: z.string().min(1, 'External ID or URL is required'),
  xmlAttributeName: z.string().optional(),
  nameUk: z.string().min(1, 'Category name is required'),
  nameEn: z.string().nullable().optional(),
  fullPathUk: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  defaultCommissionPercent: z.number().min(0).max(99).default(0).optional(),
  defaultFixedFee: z.number().min(0).default(0).optional(),
});

export type CreateMarketplaceCategoryDto = z.infer<typeof CreateMarketplaceCategoryDtoSchema>;

export const UpdateMarketplaceCategoryDtoSchema = z.object({
  marketplaceCode: z.string().optional(),
  externalId: z.string().min(1, 'External ID or URL is required').optional(),
  xmlAttributeName: z.string().optional(),
  nameUk: z.string().min(1, 'Category name is required').optional(),
  nameEn: z.string().nullable().optional(),
  fullPathUk: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  defaultCommissionPercent: z.number().min(0).max(99).optional(),
  defaultFixedFee: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateMarketplaceCategoryDto = z.infer<typeof UpdateMarketplaceCategoryDtoSchema>;

export const ImportMarketplaceCategoriesDtoSchema = z.object({
  items: z.array(CreateMarketplaceCategoryDtoSchema),
});

export type ImportMarketplaceCategoriesDto = z.infer<typeof ImportMarketplaceCategoriesDtoSchema>;

export const SupplierCategoryMarketplaceMappingDtoSchema = z.object({
  marketplaceCode: z.string(),
  marketplaceCategoryId: z.string().nullable().optional(),
  externalCategoryId: z.string(),
  externalCategoryName: z.string(),
  commissionPercent: z.number().min(0).max(99).default(0),
  fixedFee: z.number().min(0).default(0),
});

export type SupplierCategoryMarketplaceMappingDto = z.infer<
  typeof SupplierCategoryMarketplaceMappingDtoSchema
>;

export const CategoryMarkupTypeSchema = z.enum(['PERCENT', 'FIXED']);
export type CategoryMarkupType = z.infer<typeof CategoryMarkupTypeSchema>;

export const SupplierCategoryRuleDtoSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  feedCategoryId: z.string(),
  name: z.string().min(1, 'Category name is required'),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  markupType: CategoryMarkupTypeSchema.default('PERCENT').optional(),
  marginPercent: z.number().min(0).nullable().optional(),
  fixedMarkup: z.number().min(0).nullable().optional(),
  commissionPercent: z.number().min(0).max(99).nullable().optional(),
  marketplaceCategoryId: z.string().nullable().optional(),
  marketplaceCode: z.string().nullable().optional(),
  externalCategoryId: z.string().nullable().optional(),
  externalCategoryName: z.string().nullable().optional(),
  marketplaceMappings: z.record(z.string(), SupplierCategoryMarketplaceMappingDtoSchema).optional(),
  productCount: z.number().int().nonnegative().default(0),
  feedSourceId: z.string().nullable().optional(),
  feedName: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]),
});

export type SupplierCategoryRuleDto = z.infer<typeof SupplierCategoryRuleDtoSchema>;

export const UpdateSupplierCategoryRuleDtoSchema = z.object({
  name: z.string().optional(),
  feedCategoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  markupType: CategoryMarkupTypeSchema.optional(),
  marginPercent: z.number().min(0).nullable().optional(),
  fixedMarkup: z.number().min(0).nullable().optional(),
  commissionPercent: z.number().min(0).max(99).nullable().optional(),
  marketplaceCategoryId: z.string().nullable().optional(),
  marketplaceCode: z.string().nullable().optional(),
  externalCategoryId: z.string().nullable().optional(),
  externalCategoryName: z.string().nullable().optional(),
  feedSourceId: z.string().nullable().optional(),
  feedName: z.string().nullable().optional(),
  productCount: z.number().int().nonnegative().optional(),
});

export type UpdateSupplierCategoryRuleDto = z.infer<typeof UpdateSupplierCategoryRuleDtoSchema>;

export const BatchToggleCategoryStatusDtoSchema = z.object({
  categoryIds: z.array(z.string()),
  isActive: z.boolean(),
});

export type BatchToggleCategoryStatusDto = z.infer<typeof BatchToggleCategoryStatusDtoSchema>;
