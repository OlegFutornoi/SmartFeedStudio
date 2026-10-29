import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { S3StorageService } from '@/modules/storage/services/s3-storage.service';

@Injectable()
@Processor('storage-cleanup')
export class StorageGcProcessor extends WorkerHost {
  private readonly logger = new Logger(StorageGcProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3StorageService: S3StorageService,
  ) {
    super();
  }

  async process(job: Job): Promise<{ success: boolean; count?: number }> {
    this.logger.log(`Processing storage GC job: ${job.name} (id: ${job.id})`);

    switch (job.name) {
      case 'clean-abandoned-uploads':
        return this.cleanAbandonedUploads();
      case 'cascade-feed-cleanup':
        return this.cascadeCleanupKeys(job.data?.s3Keys || []);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { success: false };
    }
  }

  private async cleanAbandonedUploads(): Promise<{ success: boolean; count: number }> {
    const expiredPendingFiles = await this.prisma.storageFile.findMany({
      where: {
        status: 'PENDING_UPLOAD',
        expiresAt: {
          lt: new Date(),
        },
      },
      take: 200,
    });

    if (expiredPendingFiles.length === 0) {
      return { success: true, count: 0 };
    }

    this.logger.log(`Found ${expiredPendingFiles.length} expired pending uploads to purge`);

    // 1. Concurrently purge objects from S3 storage (DB-06, DEF-12)
    await Promise.allSettled(
      expiredPendingFiles.map((file) => this.s3StorageService.deleteObject(file.s3Key)),
    );

    // 2. Purge database records in a single batched query to eliminate N+1 latency
    const idsToPurge = expiredPendingFiles.map((file) => file.id);
    const { count } = await this.prisma.storageFile.deleteMany({
      where: { id: { in: idsToPurge } },
    });

    return { success: true, count };
  }

  private async cascadeCleanupKeys(keys: string[]): Promise<{ success: boolean; count: number }> {
    if (!keys || keys.length === 0) {
      return { success: true, count: 0 };
    }

    const results = await Promise.allSettled(
      keys.map((key) => this.s3StorageService.deleteObject(key)),
    );
    const deletedCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;

    return { success: true, count: deletedCount };
  }
}
