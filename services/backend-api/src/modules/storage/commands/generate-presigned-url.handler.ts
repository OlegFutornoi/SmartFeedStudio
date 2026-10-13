import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PresignedUploadUrlResult, StorageFileCategory } from '@smartfeed/shared';
import * as crypto from 'crypto';
import { GeneratePresignedUploadUrlCommand } from '@/modules/storage/commands/generate-presigned-url.command';
import { PrismaService } from '@/prisma/prisma.service';
import { S3StorageService } from '@/modules/storage/services/s3-storage.service';

@Injectable()
@CommandHandler(GeneratePresignedUploadUrlCommand)
export class GeneratePresignedUploadUrlHandler implements ICommandHandler<
  GeneratePresignedUploadUrlCommand,
  PresignedUploadUrlResult
> {
  private readonly logger = new Logger(GeneratePresignedUploadUrlHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(command: GeneratePresignedUploadUrlCommand): Promise<PresignedUploadUrlResult> {
    const { userId, fileName, contentType, folder, fileSize } = command;

    const ALLOWED_FOLDERS = new Set(['images', 'snapshots', 'catalogs', 'exports']);
    const targetFolder =
      folder && ALLOWED_FOLDERS.has(folder.toLowerCase().trim())
        ? folder.toLowerCase().trim()
        : 'images';

    const ALLOWED_MIME_TYPES = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/xml',
      'text/xml',
      'text/csv',
      'application/json',
      'application/zip',
      'application/octet-stream',
    ]);

    const normalizedContentType = (contentType || '').toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedContentType)) {
      throw new BadRequestException(
        `Unsupported or unsafe Content-Type: "${contentType}". Allowed types: JPEG, PNG, WEBP, GIF, XML, CSV, JSON, ZIP.`,
      );
    }

    // Layer 2 AppSec & Quota pre-check (Prevent presigned hoarding)
    if (fileSize && fileSize > 0) {
      const license = await this.prisma.license.findFirst({
        where: { userId, isActive: true },
        include: { tariffPlan: true },
      });

      if (license) {
        const rawLicenseStorage = license.maxStorageGb ? Number(license.maxStorageGb) : 0;
        const rawPlanStorage = license.tariffPlan?.maxStorageGb
          ? Number(license.tariffPlan.maxStorageGb)
          : 0;
        const maxStorageGb = rawLicenseStorage > 0 ? rawLicenseStorage : rawPlanStorage;
        const maxStorageBytes = BigInt(Math.floor(maxStorageGb * 1024 * 1024 * 1024));

        if (maxStorageGb > 0) {
          const currentUsed = license.usedStorageBytes || BigInt(0);
          if (currentUsed + BigInt(fileSize) > maxStorageBytes) {
            throw new ForbiddenException({
              statusCode: 403,
              error: 'Forbidden',
              code: 'STORAGE_QUOTA_EXCEEDED',
              message:
                'STORAGE_QUOTA_EXCEEDED: Cannot generate upload URL because this file exceeds your remaining storage quota.',
            });
          }
        }
      }
    }

    // Path traversal defense: strip any path separators and keep only safe basename
    const rawBase = fileName.split(/[/\\]/).pop() || 'upload';
    const lastDotIdx = rawBase.lastIndexOf('.');
    const rawName = lastDotIdx > 0 ? rawBase.slice(0, lastDotIdx) : rawBase;
    const rawExt = lastDotIdx > 0 ? rawBase.slice(lastDotIdx + 1) : 'webp';

    const sanitizedBase = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file';
    const sanitizedExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'webp';
    const uniqueSuffix = crypto.randomBytes(3).toString('hex');

    // Semantic S3 key: human-readable name at the start, unique suffix before extension
    const s3Key = `${targetFolder}/${userId}/${sanitizedBase}_${uniqueSuffix}.${sanitizedExt}`;

    const expiresInSeconds = 60 * 15; // 15 minutes validity

    const uploadUrl = await this.s3StorageService.generatePresignedUploadUrl(
      s3Key,
      contentType,
      {
        userId,
        uploadedAt: new Date().toISOString(),
      },
      expiresInSeconds,
    );

    const publicUrl = this.s3StorageService.getPublicUrl(s3Key);

    let category = StorageFileCategory.PRODUCT_IMAGE;
    if (targetFolder === 'catalogs') category = StorageFileCategory.FEED_CATALOG;
    else if (targetFolder === 'snapshots') category = StorageFileCategory.SYSTEM_BACKUP;
    else if (targetFolder === 'exports') category = StorageFileCategory.EXPORT_ARCHIVE;

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    try {
      await this.prisma.storageFile.create({
        data: {
          userId,
          category,
          status: 'PENDING_UPLOAD',
          bucketName: this.s3StorageService.getBucketName(),
          s3Key,
          publicUrl,
          originalName: `${sanitizedBase}.${sanitizedExt}`,
          mimeType: normalizedContentType,
          sizeBytes: BigInt(fileSize || 0),
          expiresAt,
        },
      });
    } catch (err: unknown) {
      this.logger.warn(
        `Could not pre-create pending StorageFile record for ${s3Key}: ${(err as Error).message}`,
      );
    }

    this.logger.log(
      `Generated presigned upload URL for user=${userId}, key=${s3Key}, contentType=${contentType}, size=${fileSize || 'unknown'}`,
    );

    return {
      uploadUrl,
      s3Key,
      publicUrl,
      expiresInSeconds,
    };
  }
}
