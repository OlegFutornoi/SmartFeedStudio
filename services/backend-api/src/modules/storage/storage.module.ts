import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/prisma/prisma.module';
import { LicensesModule } from '@/modules/licenses/licenses.module';
import { StorageController } from '@/modules/storage/storage.controller';
import { GeneratePresignedUploadUrlHandler } from '@/modules/storage/commands/generate-presigned-url.handler';
import { ConfirmUploadHandler } from '@/modules/storage/commands/confirm-upload.handler';
import { DeleteStorageFileHandler } from '@/modules/storage/commands/delete-storage-file.handler';
import { InitWorkspaceHandler } from '@/modules/storage/commands/init-workspace.handler';
import { OpenWorkspaceFolderHandler } from '@/modules/storage/commands/open-workspace-folder.handler';
import { CreateLocalBackupHandler } from '@/modules/storage/commands/create-local-backup.handler';
import { RunDatabaseMaintenanceHandler } from '@/modules/storage/commands/run-database-maintenance.handler';
import { ClearStorageCacheHandler } from '@/modules/storage/commands/clear-storage-cache.handler';
import { MigrateWorkspaceHandler } from '@/modules/storage/commands/migrate-workspace.handler';
import { SelectWorkspaceFolderHandler } from '@/modules/storage/commands/select-workspace-folder.handler';
import { CleanupOrphansHandler } from '@/modules/storage/commands/cleanup-orphans.handler';
import { GetDefaultWorkspacePathHandler } from '@/modules/storage/queries/get-default-workspace-path.handler';
import { GetWorkspaceInfoHandler } from '@/modules/storage/queries/get-workspace-info.handler';
import { GetStorageStatsHandler } from '@/modules/storage/queries/get-storage-stats.handler';
import { GetStorageQuotaHandler } from '@/modules/storage/queries/get-storage-quota.handler';
import { GetStorageFilesHandler } from '@/modules/storage/queries/get-storage-files.handler';
import { S3StorageService } from '@/modules/storage/services/s3-storage.service';
import { StorageSchedulerService } from '@/modules/storage/services/storage-scheduler.service';
import { StorageGcProcessor } from '@/modules/storage/processors/storage-gc.processor';
import { RequireStorageQuotaGuard } from '@/modules/storage/guards/require-storage-quota.guard';

export const CommandHandlers = [
  GeneratePresignedUploadUrlHandler,
  ConfirmUploadHandler,
  DeleteStorageFileHandler,
  InitWorkspaceHandler,
  OpenWorkspaceFolderHandler,
  CreateLocalBackupHandler,
  RunDatabaseMaintenanceHandler,
  ClearStorageCacheHandler,
  MigrateWorkspaceHandler,
  SelectWorkspaceFolderHandler,
  CleanupOrphansHandler,
];

export const QueryHandlers = [
  GetDefaultWorkspacePathHandler,
  GetWorkspaceInfoHandler,
  GetStorageStatsHandler,
  GetStorageQuotaHandler,
  GetStorageFilesHandler,
];

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    LicensesModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'storage-cleanup',
    }),
  ],
  controllers: [StorageController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    S3StorageService,
    StorageSchedulerService,
    StorageGcProcessor,
    RequireStorageQuotaGuard,
  ],
  exports: [...CommandHandlers, ...QueryHandlers, S3StorageService],
})
export class StorageModule {}
