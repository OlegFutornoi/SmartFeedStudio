import { z } from 'zod';

export const SupplierCategoryRuleDtoSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  feedCategoryId: z.string(),
  name: z.string().min(1, 'Category name is required'),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  marginPercent: z.number().min(0).nullable().optional(),
  fixedMarkup: z.number().min(0).nullable().optional(),
  productCount: z.number().int().nonnegative().default(0),
  feedSourceId: z.string().nullable().optional(),
  feedName: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]),
});

export type SupplierCategoryRuleDto = z.infer<typeof SupplierCategoryRuleDtoSchema>;

export const UpdateSupplierCategoryRuleDtoSchema = z.object({
  isActive: z.boolean().optional(),
  marginPercent: z.number().min(0).nullable().optional(),
  fixedMarkup: z.number().min(0).nullable().optional(),
});

export type UpdateSupplierCategoryRuleDto = z.infer<typeof UpdateSupplierCategoryRuleDtoSchema>;

export const BatchToggleCategoryStatusDtoSchema = z.object({
  categoryIds: z.array(z.string()),
  isActive: z.boolean(),
});

export type BatchToggleCategoryStatusDto = z.infer<typeof BatchToggleCategoryStatusDtoSchema>;
