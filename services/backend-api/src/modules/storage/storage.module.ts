import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { LicensesModule } from '@/modules/licenses/licenses.module';
import { StorageController } from '@/modules/storage/storage.controller';
import { GeneratePresignedUploadUrlHandler } from '@/modules/storage/commands/generate-presigned-url.handler';
import { InitWorkspaceHandler } from '@/modules/storage/commands/init-workspace.handler';
import { OpenWorkspaceFolderHandler } from '@/modules/storage/commands/open-workspace-folder.handler';
import { CreateLocalBackupHandler } from '@/modules/storage/commands/create-local-backup.handler';
import { RunDatabaseMaintenanceHandler } from '@/modules/storage/commands/run-database-maintenance.handler';
import { ClearStorageCacheHandler } from '@/modules/storage/commands/clear-storage-cache.handler';
import { MigrateWorkspaceHandler } from '@/modules/storage/commands/migrate-workspace.handler';
import { SelectWorkspaceFolderHandler } from '@/modules/storage/commands/select-workspace-folder.handler';
import { GetDefaultWorkspacePathHandler } from '@/modules/storage/queries/get-default-workspace-path.handler';
import { GetWorkspaceInfoHandler } from '@/modules/storage/queries/get-workspace-info.handler';
import { GetStorageStatsHandler } from '@/modules/storage/queries/get-storage-stats.handler';

export const CommandHandlers = [
  GeneratePresignedUploadUrlHandler,
  InitWorkspaceHandler,
  OpenWorkspaceFolderHandler,
  CreateLocalBackupHandler,
  RunDatabaseMaintenanceHandler,
  ClearStorageCacheHandler,
  MigrateWorkspaceHandler,
  SelectWorkspaceFolderHandler,
];

export const QueryHandlers = [
  GetDefaultWorkspacePathHandler,
  GetWorkspaceInfoHandler,
  GetStorageStatsHandler,
];

@Module({
  imports: [CqrsModule, ConfigModule, LicensesModule, PrismaModule],
  controllers: [StorageController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class StorageModule {}
