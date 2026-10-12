import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class StorageSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(StorageSchedulerService.name);

  constructor(
    @InjectQueue('storage-cleanup')
    private readonly storageQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Repeat every 6 hours to purge unconfirmed/abandoned uploads
      await this.storageQueue.add(
        'clean-abandoned-uploads',
        {},
        {
          jobId: 'storage-abandoned-uploads-cron',
          repeat: {
            pattern: '0 */6 * * *',
          },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );
      this.logger.log('Scheduled periodic storage cleanup job (every 6h)');
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to schedule storage cleanup recurring job: ${(err as Error).message}`,
      );
    }
  }
}
