import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { CleanupOrphansResponseDto } from '@smartfeed/shared';
import { CleanupOrphansCommand } from '@/modules/storage/commands/cleanup-orphans.command';
import { PrismaService } from '@/prisma/prisma.service';
import { S3StorageService } from '@/modules/storage/services/s3-storage.service';

@Injectable()
@CommandHandler(CleanupOrphansCommand)
export class CleanupOrphansHandler implements ICommandHandler<
  CleanupOrphansCommand,
  CleanupOrphansResponseDto
> {
  private readonly logger = new Logger(CleanupOrphansHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(command: CleanupOrphansCommand): Promise<CleanupOrphansResponseDto> {
    const { userId, dto } = command;
    const dryRun = Boolean(dto.dryRun);

    const ALLOWED_FOLDERS = new Set(['images', 'snapshots', 'catalogs', 'exports']);
    const targetFolder =
      dto.folder && ALLOWED_FOLDERS.has(dto.folder.toLowerCase().trim())
        ? dto.folder.toLowerCase().trim()
        : 'images';

    const activeKeysSet = dto.activeKeys ? new Set(dto.activeKeys.map((k) => k.trim())) : null;

    const userPrefix = `${targetFolder}/${userId}/`;
    this.logger.log(
      `Scanning S3 for orphaned files: user="${userId}", prefix="${userPrefix}", activeKeysCount=${activeKeysSet ? activeKeysSet.size : 'none'}, dryRun=${dryRun}`,
    );

    // 1. Fetch all S3 objects under user's folder
    const s3Objects = await this.s3StorageService.listObjects(userPrefix);

    // 2. Fetch all known registered active/pending storage files in PostgreSQL
    const registeredFiles = await this.prisma.storageFile.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING_UPLOAD'] },
      },
    });

    const registeredKeysMap = new Map(registeredFiles.map((f) => [f.s3Key, Number(f.sizeBytes)]));

    // 3. Find orphaned keys:
    const orphanMap = new Map<string, number>(); // s3Key -> size

    if (activeKeysSet) {
      // Reconcile against catalog: anything in S3 or DB not in activeKeys is orphan
      for (const obj of s3Objects) {
        if (!activeKeysSet.has(obj.key) || obj.key.includes('img_undefined')) {
          orphanMap.set(obj.key, obj.size);
        }
      }

      for (const file of registeredFiles) {
        // Skip snapshots backups when cleaning images
        if (file.category === 'SYSTEM_BACKUP' || file.s3Key.startsWith(`snapshots/`)) {
          continue;
        }
        if (!activeKeysSet.has(file.s3Key) || file.s3Key.includes('img_undefined')) {
          if (!orphanMap.has(file.s3Key)) {
            orphanMap.set(file.s3Key, Number(file.sizeBytes));
          }
        }
      }
    } else {
      // Fallback: S3 objects missing from DB or corrupted
      for (const obj of s3Objects) {
        if (!registeredKeysMap.has(obj.key) || obj.key.includes('img_undefined')) {
          orphanMap.set(obj.key, obj.size);
        }
      }
    }

    const orphanKeys = Array.from(orphanMap.keys());
    const orphanCount = orphanKeys.length;
    const orphanSizeBytes = Array.from(orphanMap.values()).reduce((a, b) => a + b, 0);

    let freedBytes = 0;
    const deletedKeys: string[] = [];

    // 4. If not dry run, purge each orphaned object from S3 and PostgreSQL
    if (!dryRun && orphanCount > 0) {
      for (const key of orphanKeys) {
        const deleted = await this.s3StorageService.deleteObject(key);
        if (deleted) {
          freedBytes += orphanMap.get(key) || 0;
          deletedKeys.push(key);
        }
      }

      // Purge matching records from PostgreSQL and recalculate license quota
      await this.prisma.$transaction(async (tx) => {
        await tx.storageFile.deleteMany({
          where: {
            userId,
            s3Key: { in: orphanKeys },
          },
        });

        // Exact recalculation of usedStorageBytes based on remaining active files
        const remainingAgg = await tx.storageFile.aggregate({
          where: { userId, status: 'ACTIVE' },
          _sum: { sizeBytes: true },
        });

        const exactUsedBytes = remainingAgg._sum.sizeBytes ?? BigInt(0);

        await tx.license.updateMany({
          where: { userId, isActive: true },
          data: {
            usedStorageBytes: exactUsedBytes,
          },
        });
      });

      this.logger.log(
        `Purged ${deletedKeys.length} orphan files (${freedBytes} bytes) for user="${userId}"`,
      );
    }

    return {
      dryRun,
      orphanCount,
      orphanSizeBytes,
      freedBytes,
      deletedKeys: dryRun ? orphanKeys : deletedKeys,
    };
  }
}
