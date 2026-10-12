import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteStorageFileCommand } from '@/modules/storage/commands/delete-storage-file.command';
import { S3StorageService } from '@/modules/storage/services/s3-storage.service';

@Injectable()
@CommandHandler(DeleteStorageFileCommand)
export class DeleteStorageFileHandler implements ICommandHandler<
  DeleteStorageFileCommand,
  { success: boolean; freedBytes: number }
> {
  private readonly logger = new Logger(DeleteStorageFileHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async execute(
    command: DeleteStorageFileCommand,
  ): Promise<{ success: boolean; freedBytes: number }> {
    const { userId, fileId } = command;

    const file = await this.prisma.storageFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`Storage file with ID "${fileId}" not found.`);
    }

    // Layer 3 Tenant Isolation Guard: ensure file belongs to the user
    if (file.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this file.');
    }

    const freedBytes = file.status === 'ACTIVE' ? Number(file.sizeBytes) : 0;

    // 1. Delete object from Cloudflare R2 / S3
    await this.s3StorageService.deleteObject(file.s3Key);

    // 2. Decrement user's license quota usedStorageBytes & remove DB record inside transaction
    await this.prisma.$transaction(async (tx) => {
      if (file.status === 'ACTIVE' && file.sizeBytes > BigInt(0)) {
        await tx.license.updateMany({
          where: { userId, isActive: true },
          data: {
            usedStorageBytes: {
              decrement: file.sizeBytes,
            },
          },
        });
      }

      await tx.storageFile.delete({
        where: { id: fileId },
      });
    });

    this.logger.log(
      `Storage file deleted: id=${fileId}, key=${file.s3Key}, freedBytes=${freedBytes}`,
    );

    return {
      success: true,
      freedBytes,
    };
  }
}
