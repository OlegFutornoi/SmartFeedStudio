import { z } from 'zod';
import { ProductStatus } from '../enums/index.js';

export const ProductAttributeDtoSchema = z.object({
  id: z.string().optional(),
  nameUk: z.string().min(1, 'Attribute name (UK) is required'),
  nameEn: z.string().nullable().optional(),
  valueUk: z.string().min(1, 'Attribute value (UK) is required'),
  valueEn: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  order: z.number().int().default(0),
});

export type ProductAttributeDto = z.infer<typeof ProductAttributeDtoSchema>;

export const ProductImageDtoSchema = z.object({
  id: z.string().optional(),
  originalUrl: z.string().url('Invalid image URL'),
  cloudUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  s3Key: z.string().nullable().optional(),
  localPath: z.string().nullable().optional(),
  thumbnailPath: z.string().nullable().optional(),
  fileHash: z.string().nullable().optional(),
  fileSize: z.number().int().optional(),
  status: z.string().optional(),
  order: z.number().int().default(0),
  isMain: z.boolean().default(false),
});

export type ProductImageDto = z.infer<typeof ProductImageDtoSchema>;

export const ProductCategoryDtoSchema = z.object({
  id: z.string(),
  catalogId: z.string(),
  externalId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  nameUk: z.string(),
  nameEn: z.string().nullable().optional(),
  order: z.number().int().default(0),
  productsCount: z.number().int().optional(),
});

export type ProductCategoryDto = z.infer<typeof ProductCategoryDtoSchema>;

export const ProductDtoSchema = z.object({
  id: z.string(),
  catalogId: z.string(),
  supplierId: z.string(),
  supplierName: z.string().optional(),
  supplierCode: z.string().optional(),
  feedSourceId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  categoryNameUk: z.string().nullable().optional(),
  sku: z.string().min(1, 'SKU is required'),
  externalId: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  vendorCode: z.string().nullable().optional(),
  titleUk: z.string().min(1, 'Title (UK) is required'),
  titleEn: z.string().nullable().optional(),
  descriptionUk: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  costPrice: z.number().default(0),
  price: z.number().default(0),
  oldPrice: z.number().nullable().optional(),
  currency: z.string().default('UAH'),
  stockQuantity: z.number().int().default(0),
  inStock: z.boolean().default(true),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  rawPayload: z.record(z.any()).nullable().optional(),
  images: z.array(ProductImageDtoSchema).default([]),
  attributes: z.array(ProductAttributeDtoSchema).default([]),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ProductDto = z.infer<typeof ProductDtoSchema>;

export const CreateProductDtoSchema = z.object({
  catalogId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  categoryId: z.string().nullable().optional(),
  sku: z.string().min(1, 'SKU is required'),
  externalId: z.string().optional(),
  barcode: z.string().optional(),
  vendorCode: z.string().optional(),
  titleUk: z.string().min(2, 'Title must be at least 2 characters'),
  titleEn: z.string().optional(),
  descriptionUk: z.string().optional(),
  descriptionEn: z.string().optional(),
  vendor: z.string().optional(),
  costPrice: z.number().min(0).default(0),
  price: z.number().min(0, 'Price cannot be negative'),
  oldPrice: z.number().min(0).optional(),
  currency: z.string().default('UAH'),
  stockQuantity: z.number().int().min(0).default(0),
  inStock: z.boolean().default(true),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  images: z.array(ProductImageDtoSchema).optional().default([]),
  attributes: z.array(ProductAttributeDtoSchema).optional().default([]),
});

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;

export const UpdateProductDtoSchema = CreateProductDtoSchema.partial();

export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>;

export const ProductFilterDtoSchema = z.object({
  catalogId: z.string().optional(),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  inStock: z.boolean().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'price', 'titleUk', 'sku', 'stockQuantity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ProductFilterDto = z.infer<typeof ProductFilterDtoSchema>;

export const PaginatedProductsDtoSchema = z.object({
  items: z.array(ProductDtoSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
});

export type PaginatedProductsDto = z.infer<typeof PaginatedProductsDtoSchema>;

export const BulkDeleteProductsDtoSchema = z.object({
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  supplierIds: z.array(z.string()).optional(),
});

export type BulkDeleteProductsDto = z.infer<typeof BulkDeleteProductsDtoSchema>;

export const BulkDeleteResultDtoSchema = z.object({
  deletedCount: z.number().int().nonnegative(),
  remainingCount: z.number().int().nonnegative(),
  message: z.string(),
});

export type BulkDeleteResultDto = z.infer<typeof BulkDeleteResultDtoSchema>;

export const ProductCategorySummaryDtoSchema = z.object({
  id: z.string(),
  nameUk: z.string(),
  nameEn: z.string().nullable().optional(),
  productCount: z.number().int().nonnegative(),
  supplierName: z.string().optional(),
});

export type ProductCategorySummaryDto = z.infer<typeof ProductCategorySummaryDtoSchema>;
