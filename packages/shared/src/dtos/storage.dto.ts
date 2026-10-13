import { z } from 'zod';

export const PresignedUrlRequestDtoSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.string().min(1, 'Content type is required'),
  folder: z.string().optional().default('images'),
  fileSize: z.number().int().positive().max(524288000).optional(),
});

export type PresignedUrlRequestDto = z.infer<typeof PresignedUrlRequestDtoSchema>;

export const PresignedUrlResponseDtoSchema = z.object({
  uploadUrl: z.string().url(),
  s3Key: z.string(),
  publicUrl: z.string().url().optional(),
  expiresInSeconds: z.number(),
});

export type PresignedUrlResponseDto = z.infer<typeof PresignedUrlResponseDtoSchema>;

export const WorkspaceInfoDtoSchema = z.object({
  workspacePath: z.string(),
  isInitialized: z.boolean(),
  databasePath: z.string(),
  isEncrypted: z.boolean(),
  encryptionAlgorithm: z.string(),
  createdAt: z.string().optional(),
  lastBackupAt: z.string().optional(),
});

export type WorkspaceInfoDto = z.infer<typeof WorkspaceInfoDtoSchema>;

export const StorageStatsDtoSchema = z.object({
  databaseSizeBytes: z.number(),
  feedsSizeBytes: z.number(),
  exportsSizeBytes: z.number(),
  backupsSizeBytes: z.number(),
  logsSizeBytes: z.number(),
  totalSizeBytes: z.number(),
  availableDiskSpaceBytes: z.number().optional(),
  productsCount: z.number(),
  suppliersCount: z.number(),
  feedsCount: z.number(),
});

export type StorageStatsDto = z.infer<typeof StorageStatsDtoSchema>;

export const DatabaseMaintenanceResultDtoSchema = z.object({
  success: z.boolean(),
  integrityOk: z.boolean(),
  bytesFreed: z.number(),
  message: z.string(),
  timestamp: z.string(),
});

export type DatabaseMaintenanceResultDto = z.infer<typeof DatabaseMaintenanceResultDtoSchema>;

export const InitWorkspaceDtoSchema = z.object({
  workspacePath: z.string().min(1, 'Workspace path is required'),
  enableEncryption: z.boolean().optional().default(true),
});

export type InitWorkspaceDto = z.infer<typeof InitWorkspaceDtoSchema>;

export const MigrateWorkspaceDtoSchema = z.object({
  newWorkspacePath: z.string().min(1, 'New workspace path is required'),
  moveExistingData: z.boolean().default(true),
});

export type MigrateWorkspaceDto = z.infer<typeof MigrateWorkspaceDtoSchema>;

export const OpenWorkspaceFolderDtoSchema = z.object({
  path: z.string().min(1, 'Path is required'),
});

export type OpenWorkspaceFolderDto = z.infer<typeof OpenWorkspaceFolderDtoSchema>;

export const ClearStorageCacheResultDtoSchema = z.object({
  bytesFreed: z.number(),
  filesRemoved: z.number().optional(),
});

export type ClearStorageCacheResultDto = z.infer<typeof ClearStorageCacheResultDtoSchema>;

export const CreateLocalBackupResultDtoSchema = z.object({
  backupPath: z.string(),
  sizeBytes: z.number().optional(),
  createdAt: z.string(),
});

export type CreateLocalBackupResultDto = z.infer<typeof CreateLocalBackupResultDtoSchema>;

export enum StorageFileCategory {
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
  FEED_CATALOG = 'FEED_CATALOG',
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  EXPORT_ARCHIVE = 'EXPORT_ARCHIVE',
}

export enum StorageFileStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export const StorageFileDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string().nullable().optional(),
  category: z.nativeEnum(StorageFileCategory),
  status: z.nativeEnum(StorageFileStatus),
  bucketName: z.string(),
  s3Key: z.string(),
  publicUrl: z.string().url(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  refCount: z.number().int().default(1),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StorageFileDto = z.infer<typeof StorageFileDtoSchema>;

export const ConfirmUploadRequestDtoSchema = z.object({
  s3Key: z.string().min(1, 'S3 key is required'),
  category: z.nativeEnum(StorageFileCategory).default(StorageFileCategory.PRODUCT_IMAGE),
  originalName: z.string().optional(),
  checksumSha256: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

export type ConfirmUploadRequestDto = z.infer<typeof ConfirmUploadRequestDtoSchema>;

export const StorageQuotaDtoSchema = z.object({
  canCloudStorage: z.boolean(),
  maxStorageGb: z.number(),
  usedStorageBytes: z.number(),
  availableBytes: z.number(),
  usedPercentage: z.number(),
  totalFilesCount: z.number(),
  planType: z.string(),
});

export type StorageQuotaDto = z.infer<typeof StorageQuotaDtoSchema>;

export const StorageFileListQueryDtoSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  folder: z.string().optional(),
  search: z.string().optional(),
});

export type StorageFileListQueryDto = z.infer<typeof StorageFileListQueryDtoSchema>;

export const StorageFileListResponseDtoSchema = z.object({
  items: z.array(StorageFileDtoSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type StorageFileListResponseDto = z.infer<typeof StorageFileListResponseDtoSchema>;

export const CatalogMediaStatsDtoSchema = z.object({
  totalImages: z.number().int().nonnegative(),
  syncedCloudCount: z.number().int().nonnegative(),
  localOnlyCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  totalSizeBytes: z.number().int().nonnegative(),
});

export type CatalogMediaStatsDto = z.infer<typeof CatalogMediaStatsDtoSchema>;

export const CleanupOrphansRequestDtoSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  folder: z.string().optional().default('images'),
  activeKeys: z.array(z.string()).optional(),
});

export type CleanupOrphansRequestDto = z.infer<typeof CleanupOrphansRequestDtoSchema>;

export const CleanupOrphansResponseDtoSchema = z.object({
  dryRun: z.boolean(),
  orphanCount: z.number().int().nonnegative(),
  orphanSizeBytes: z.number().int().nonnegative(),
  freedBytes: z.number().int().nonnegative(),
  deletedKeys: z.array(z.string()),
});

export type CleanupOrphansResponseDto = z.infer<typeof CleanupOrphansResponseDtoSchema>;
