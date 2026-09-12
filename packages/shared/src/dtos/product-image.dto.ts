import { z } from 'zod';

export enum ImageDownloadStatus {
  PENDING = 'PENDING',
  DOWNLOADING = 'DOWNLOADING',
  READY = 'READY',
  FAILED = 'FAILED',
  MISSING_LOCAL = 'MISSING_LOCAL',
}

export enum ImageSyncStatus {
  LOCAL_ONLY = 'LOCAL_ONLY',
  QUEUED_FOR_UPLOAD = 'QUEUED_FOR_UPLOAD',
  SYNCED = 'SYNCED',
  SYNC_ERROR = 'SYNC_ERROR',
}

export const LocalProductImageDtoSchema = z.object({
  id: z.string(),
  productId: z.string(),
  originalUrl: z.string().url('Invalid image URL'),
  localPath: z.string().nullable().optional(),
  thumbnailPath: z.string().nullable().optional(),
  fileHash: z.string().nullable().optional(),
  fileSize: z.number().int().nonnegative().default(0),
  mimeType: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  order: z.number().int().default(0),
  isMain: z.boolean().default(false),
  status: z.nativeEnum(ImageDownloadStatus).default(ImageDownloadStatus.PENDING),
  downloadError: z.string().nullable().optional(),
  retryCount: z.number().int().optional().default(0),

  // Pre-engineered for future S3 cloud sync:
  s3Key: z.string().nullable().optional(),
  cloudUrl: z.string().nullable().optional(),
  syncStatus: z.nativeEnum(ImageSyncStatus).default(ImageSyncStatus.LOCAL_ONLY),
  lastSyncedAt: z.string().nullable().optional(),

  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export type LocalProductImageDto = z.infer<typeof LocalProductImageDtoSchema>;

export const CreateProductImageDtoSchema = z.object({
  productId: z.string(),
  originalUrl: z.string().url('Invalid image URL'),
  order: z.number().int().optional().default(0),
  isMain: z.boolean().optional().default(false),
});

export type CreateProductImageDto = z.infer<typeof CreateProductImageDtoSchema>;

export const UpdateProductImageOrderDtoSchema = z.object({
  productId: z.string(),
  imageIdsInOrder: z.array(z.string()),
  mainImageId: z.string().optional(),
});

export type UpdateProductImageOrderDto = z.infer<typeof UpdateProductImageOrderDtoSchema>;

export const ImageDownloadProgressDtoSchema = z.object({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  bytesDownloaded: z.number().int().nonnegative(),
  currentUrl: z.string().optional(),
  isFinished: z.boolean().default(false),
});

export type ImageDownloadProgressDto = z.infer<typeof ImageDownloadProgressDtoSchema>;

export const DeleteProductImageResultDtoSchema = z.object({
  success: z.boolean(),
  imageId: z.string(),
  fileDeleted: z.boolean(),
  remainingCount: z.number().int().nonnegative(),
  newMainImageId: z.string().nullable().optional(),
});

export type DeleteProductImageResultDto = z.infer<typeof DeleteProductImageResultDtoSchema>;
