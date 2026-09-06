import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { LicensesModule } from '../licenses/licenses.module';
import { StorageController } from './storage.controller';
import { GeneratePresignedUploadUrlHandler } from './commands/generate-presigned-url.handler';
import { InitWorkspaceHandler } from './commands/init-workspace.handler';
import { OpenWorkspaceFolderHandler } from './commands/open-workspace-folder.handler';
import { CreateLocalBackupHandler } from './commands/create-local-backup.handler';
import { RunDatabaseMaintenanceHandler } from './commands/run-database-maintenance.handler';
import { ClearStorageCacheHandler } from './commands/clear-storage-cache.handler';
import { MigrateWorkspaceHandler } from './commands/migrate-workspace.handler';
import { SelectWorkspaceFolderHandler } from './commands/select-workspace-folder.handler';
import { GetDefaultWorkspacePathHandler } from './queries/get-default-workspace-path.handler';
import { GetWorkspaceInfoHandler } from './queries/get-workspace-info.handler';
import { GetStorageStatsHandler } from './queries/get-storage-stats.handler';

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
