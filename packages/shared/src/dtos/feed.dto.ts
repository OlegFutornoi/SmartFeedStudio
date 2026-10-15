import { z } from 'zod';
import { FeedFormat, FeedSourceType, ImportJobStatus } from '../enums/index.js';

export const CategorySummaryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable().optional(),
  productCount: z.number().int().nonnegative().default(0),
});

export type CategorySummaryDto = z.infer<typeof CategorySummaryDtoSchema>;

export const FeedSourceDtoSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string().optional(),
  name: z.string().min(1, 'Feed source name is required'),
  sourceType: z.nativeEnum(FeedSourceType),
  fileFormat: z.nativeEnum(FeedFormat),
  sourceUrl: z.string().nullable().optional(),
  s3FileKey: z.string().nullable().optional(),
  authHeaderName: z.string().nullable().optional(),
  authHeaderValue: z.string().nullable().optional(),
  syncIntervalHours: z.number().int().nonnegative().default(0),
  autoUpdatePrices: z.boolean().default(true),
  autoUpdateStocks: z.boolean().default(true),
  autoCreateNewProducts: z.boolean().default(true),
  mappingRules: z.record(z.any()).nullable().optional(),
  productsCount: z.number().int().nonnegative().optional(),
  lastSyncedAt: z.union([z.date(), z.string()]).nullable().optional(),
  lastSyncStatus: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type FeedSourceDto = z.infer<typeof FeedSourceDtoSchema>;

export const CreateFeedSourceDtoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sourceType: z.nativeEnum(FeedSourceType).default(FeedSourceType.URL),
  fileFormat: z.nativeEnum(FeedFormat).default(FeedFormat.XML_ROZETKA),
  sourceUrl: z.string().optional(),
  authHeaderName: z.string().optional(),
  authHeaderValue: z.string().optional(),
  syncIntervalHours: z.number().int().min(0).default(0),
  autoUpdatePrices: z.boolean().default(true),
  autoUpdateStocks: z.boolean().default(true),
  autoCreateNewProducts: z.boolean().default(true),
  mappingRules: z.record(z.any()).optional(),
});

export type CreateFeedSourceDto = z.infer<typeof CreateFeedSourceDtoSchema>;

export const ImportJobDtoSchema = z.object({
  id: z.string(),
  feedSourceId: z.string(),
  feedSourceName: z.string().optional(),
  userId: z.string().optional(),
  status: z.nativeEnum(ImportJobStatus),
  totalItems: z.number().int().nonnegative(),
  processedItems: z.number().int().nonnegative(),
  createdItems: z.number().int().nonnegative(),
  updatedItems: z.number().int().nonnegative(),
  failedItems: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100).default(0),
  selectedCategories: z.array(z.string()).nullable().optional(),
  errorLogs: z.any().nullable().optional(),
  startedAt: z.union([z.date(), z.string()]).nullable().optional(),
  completedAt: z.union([z.date(), z.string()]).nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
});

export type ImportJobDto = z.infer<typeof ImportJobDtoSchema>;

export const ImportFeedAsyncDtoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  sourceType: z.nativeEnum(FeedSourceType).default(FeedSourceType.URL),
  sourceUrl: z.string().optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  catalogId: z.string().optional(),
  selectedCategoryIds: z.array(z.string()).optional(),
  autoUpdatePrices: z.boolean().default(true),
  autoUpdateStocks: z.boolean().default(true),
});

export type ImportFeedAsyncDto = z.infer<typeof ImportFeedAsyncDtoSchema>;

export const FeedColumnMappingSchema = z.object({
  targetField: z.string(),
  sourceField: z.string(),
  confidence: z.number().min(0).max(100).default(100),
  sampleValue: z.any().optional(),
});

export type FeedColumnMapping = z.infer<typeof FeedColumnMappingSchema>;

export const FeedAnalysisResultDtoSchema = z.object({
  detectedFormat: z.nativeEnum(FeedFormat),
  estimatedTotalItems: z.number().int().nonnegative(),
  suggestedMappings: z.array(FeedColumnMappingSchema),
  sampleItems: z.array(z.record(z.any())).default([]),
  categories: z.array(CategorySummaryDtoSchema).default([]),
});

export type FeedAnalysisResultDto = z.infer<typeof FeedAnalysisResultDtoSchema>;

export const FetchFeedUrlDtoSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export type FetchFeedUrlDto = z.infer<typeof FetchFeedUrlDtoSchema>;

export const FetchFeedResultDtoSchema = z.object({
  content: z.string(),
  contentType: z.string().optional(),
  contentLength: z.number().int().nonnegative().optional(),
});

export type FetchFeedResultDto = z.infer<typeof FetchFeedResultDtoSchema>;
