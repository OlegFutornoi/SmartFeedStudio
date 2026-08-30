import { z } from 'zod';

export const PresignedUrlRequestDtoSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.string().min(1, 'Content type is required'),
  folder: z.string().optional().default('images'),
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
