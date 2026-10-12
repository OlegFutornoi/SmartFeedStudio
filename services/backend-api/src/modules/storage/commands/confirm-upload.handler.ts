import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfirmUploadCommand } from '@/modules/storage/commands/confirm-upload.command';
import { StorageFileDto, StorageFileCategory, StorageFileStatus } from '@smartfeed/shared';
import { S3StorageService } from '@/modules/storage/services/s3-storage.service';

@Injectable()
@CommandHandler(ConfirmUploadCommand)
export class ConfirmUploadHandler implements ICommandHandler<ConfirmUploadCommand, StorageFileDto> {
  private readonly logger = new Logger(ConfirmUploadHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(command: ConfirmUploadCommand): Promise<StorageFileDto> {
    const { userId, dto } = command;
    const { s3Key, category, originalName, checksumSha256, width, height } = dto;

    // Path traversal & formatting defense
    const cleanKey = s3Key.trim();
    if (cleanKey.includes('..') || cleanKey.startsWith('/') || cleanKey.includes('\\')) {
      throw new BadRequestException('Invalid s3Key format or path traversal detected.');
    }

    const ALLOWED_FOLDERS = new Set(['images', 'snapshots', 'catalogs', 'exports']);
    const pathSegments = cleanKey.split('/');
    if (
      pathSegments.length < 3 ||
      !ALLOWED_FOLDERS.has(pathSegments[0]) ||
      pathSegments[1] !== userId
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You cannot confirm files outside your tenant workspace.',
      });
    }

    // Verify file existence in Cloudflare R2 / S3
    const headResult = await this.s3StorageService.headObject(cleanKey);
    const actualSizeBytes = BigInt(headResult?.contentLength ?? 1024);
    const detectedMimeType = headResult?.contentType ?? 'image/webp';

    const existingFile = await this.prisma.storageFile.findUnique({
      where: { s3Key: cleanKey },
    });

    let quotaDelta = actualSizeBytes;
    if (existingFile && existingFile.status === 'ACTIVE') {
      quotaDelta = actualSizeBytes - existingFile.sizeBytes;
    }

    const publicUrl = this.s3StorageService.getPublicUrl(cleanKey);

    // Layer 2 & 4: Atomic Transaction Quota Check and Accounting (TOCTOU Defense)
    const storageFile = await this.prisma.$transaction(async (tx) => {
      const license = await tx.license.findFirst({
        where: { userId, isActive: true },
        include: { tariffPlan: true },
      });

      if (!license) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Active license is required to store cloud files.',
        });
      }

      const rawLicenseStorage = license.maxStorageGb ? Number(license.maxStorageGb) : 0;
      const rawPlanStorage = license.tariffPlan?.maxStorageGb
        ? Number(license.tariffPlan.maxStorageGb)
        : 0;
      const maxStorageGb = rawLicenseStorage > 0 ? rawLicenseStorage : rawPlanStorage;
      const maxStorageBytes = BigInt(Math.floor(maxStorageGb * 1024 * 1024 * 1024));

      if (maxStorageGb > 0 && quotaDelta > BigInt(0)) {
        const currentUsed = license.usedStorageBytes || BigInt(0);
        if (currentUsed + quotaDelta > maxStorageBytes) {
          // Cleanup uploaded object from S3 immediately to prevent dangling storage
          await this.s3StorageService.deleteObject(cleanKey);
          throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            code: 'STORAGE_QUOTA_EXCEEDED',
            message:
              'STORAGE_QUOTA_EXCEEDED: Cloud storage quota exceeded. Upgrade plan or delete unused files.',
          });
        }
      }

      const fileRecord = await tx.storageFile.upsert({
        where: { s3Key: cleanKey },
        create: {
          userId,
          category: category ?? 'PRODUCT_IMAGE',
          status: 'ACTIVE',
          bucketName: this.s3StorageService.getBucketName(),
          s3Key: cleanKey,
          publicUrl,
          originalName: originalName || cleanKey.split('/').pop() || 'file',
          mimeType: detectedMimeType,
          sizeBytes: actualSizeBytes,
          checksumSha256: checksumSha256 || null,
          width: width || null,
          height: height || null,
        },
        update: {
          status: 'ACTIVE',
          sizeBytes: actualSizeBytes,
          checksumSha256: checksumSha256 || undefined,
          width: width || undefined,
          height: height || undefined,
          expiresAt: null,
        },
      });

      if (quotaDelta !== BigInt(0)) {
        await tx.license.update({
          where: { id: license.id },
          data: {
            usedStorageBytes: {
              increment: quotaDelta,
            },
          },
        });
      }

      return fileRecord;
    });

    this.logger.log(`Confirmed upload in R2: key=${cleanKey}, size=${actualSizeBytes} bytes`);

    return {
      id: storageFile.id,
      userId: storageFile.userId,
      organizationId: storageFile.organizationId,
      category: storageFile.category as StorageFileCategory,
      status: storageFile.status as StorageFileStatus,
      bucketName: storageFile.bucketName,
      s3Key: storageFile.s3Key,
      publicUrl: storageFile.publicUrl,
      originalName: storageFile.originalName,
      mimeType: storageFile.mimeType,
      sizeBytes: Number(storageFile.sizeBytes),
      checksumSha256: storageFile.checksumSha256,
      width: storageFile.width,
      height: storageFile.height,
      refCount: storageFile.refCount,
      expiresAt: storageFile.expiresAt?.toISOString() || null,
      createdAt: storageFile.createdAt.toISOString(),
      updatedAt: storageFile.updatedAt.toISOString(),
    };
  }
}
