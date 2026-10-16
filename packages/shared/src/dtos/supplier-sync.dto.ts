import { z } from 'zod';
import {
  ImageSyncMode,
  DescriptionSyncMode,
  AttributesSyncMode,
  TitleSyncMode,
  CategorySyncMode,
  BarcodeSyncMode,
  SyncPriceSource,
  SyncZeroPriceAction,
  SyncMissingProductsAction,
  SyncNewProductsAction,
  SyncStatus,
  SyncTrigger,
} from '../enums/index.js';

export const SupplierSyncSettingDtoSchema = z.object({
  id: z.string(),
  supplierId: z.string(),

  // Protection of manually edited products
  protectEditedProducts: z.boolean().default(true),

  // Commercial & inventory sync
  syncPrices: z.boolean().default(true),
  syncStocks: z.boolean().default(true),

  // Field-level granular content sync modes
  imageSyncMode: z.nativeEnum(ImageSyncMode).default(ImageSyncMode.DO_NOT_UPDATE),
  descriptionSyncMode: z.nativeEnum(DescriptionSyncMode).default(DescriptionSyncMode.DO_NOT_UPDATE),
  attributesSyncMode: z.nativeEnum(AttributesSyncMode).default(AttributesSyncMode.ADD_NEW_ONLY),
  titleSyncMode: z.nativeEnum(TitleSyncMode).default(TitleSyncMode.DO_NOT_UPDATE),
  categorySyncMode: z.nativeEnum(CategorySyncMode).default(CategorySyncMode.KEEP_MANUAL_MAPPING),
  barcodeSyncMode: z.nativeEnum(BarcodeSyncMode).default(BarcodeSyncMode.FILL_EMPTY_ONLY),

  // Pricing policies
  priceSource: z.nativeEnum(SyncPriceSource).default(SyncPriceSource.WHOLESALE),
  zeroPriceAction: z.nativeEnum(SyncZeroPriceAction).default(SyncZeroPriceAction.OUT_OF_STOCK),

  // Assortment lifecycle policies
  missingProductsAction: z
    .nativeEnum(SyncMissingProductsAction)
    .default(SyncMissingProductsAction.OUT_OF_STOCK),
  newProductsAction: z
    .nativeEnum(SyncNewProductsAction)
    .default(SyncNewProductsAction.AUTO_PUBLISH),

  // Scheduling
  syncIntervalHours: z.number().int().min(0).max(168).default(0), // 0 = manual
  lastSyncedAt: z.union([z.date(), z.string()]).nullable().optional(),
  lastSyncStatus: z.nativeEnum(SyncStatus).default(SyncStatus.IDLE),

  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export type SupplierSyncSettingDto = z.infer<typeof SupplierSyncSettingDtoSchema>;

export const UpdateSupplierSyncSettingDtoSchema = z.object({
  protectEditedProducts: z.boolean().optional(),
  syncPrices: z.boolean().optional(),
  syncStocks: z.boolean().optional(),
  imageSyncMode: z.nativeEnum(ImageSyncMode).optional(),
  descriptionSyncMode: z.nativeEnum(DescriptionSyncMode).optional(),
  attributesSyncMode: z.nativeEnum(AttributesSyncMode).optional(),
  titleSyncMode: z.nativeEnum(TitleSyncMode).optional(),
  categorySyncMode: z.nativeEnum(CategorySyncMode).optional(),
  barcodeSyncMode: z.nativeEnum(BarcodeSyncMode).optional(),
  priceSource: z.nativeEnum(SyncPriceSource).optional(),
  zeroPriceAction: z.nativeEnum(SyncZeroPriceAction).optional(),
  missingProductsAction: z.nativeEnum(SyncMissingProductsAction).optional(),
  newProductsAction: z.nativeEnum(SyncNewProductsAction).optional(),
  syncIntervalHours: z.number().int().min(0).max(168).optional(),
});

export type UpdateSupplierSyncSettingDto = z.infer<typeof UpdateSupplierSyncSettingDtoSchema>;

export const SupplierSyncLogDtoSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  feedSourceId: z.string().nullable().optional(),
  trigger: z.nativeEnum(SyncTrigger).default(SyncTrigger.MANUAL),
  status: z.nativeEnum(SyncStatus).default(SyncStatus.RUNNING),
  startedAt: z.union([z.date(), z.string()]),
  completedAt: z.union([z.date(), z.string()]).nullable().optional(),
  durationMs: z.number().int().nonnegative().nullable().optional(),
  totalProducts: z.number().int().nonnegative().default(0),
  createdCount: z.number().int().nonnegative().default(0),
  updatedCount: z.number().int().nonnegative().default(0),
  outOfStockCount: z.number().int().nonnegative().default(0),
  errorsCount: z.number().int().nonnegative().default(0),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});

export type SupplierSyncLogDto = z.infer<typeof SupplierSyncLogDtoSchema>;

export const TriggerSupplierSyncDtoSchema = z.object({
  feedSourceId: z.string().optional(),
  forceFull: z.boolean().optional().default(false),
});

export type TriggerSupplierSyncDto = z.infer<typeof TriggerSupplierSyncDtoSchema>;

export const SupplierSyncResultDtoSchema = z.object({
  success: z.boolean(),
  logId: z.string(),
  supplierId: z.string(),
  feedSourceId: z.string().nullable().optional(),
  totalProducts: z.number().int().nonnegative(),
  createdCount: z.number().int().nonnegative(),
  updatedCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  errorsCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  message: z.string(),
});

export type SupplierSyncResultDto = z.infer<typeof SupplierSyncResultDtoSchema>;
