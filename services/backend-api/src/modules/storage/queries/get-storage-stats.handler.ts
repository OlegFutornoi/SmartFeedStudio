import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStorageStatsQuery } from '@/modules/storage/queries/get-storage-stats.query';
import { StorageStatsDto } from '@smartfeed/shared';
import {
  calculateDirSizeBytesAsync,
  resolveWorkspacePath,
} from '@/modules/storage/utils/workspace-utils';
import * as path from 'path';
import * as fs from 'fs';

@QueryHandler(GetStorageStatsQuery)
export class GetStorageStatsHandler implements IQueryHandler<GetStorageStatsQuery> {
  async execute(query: GetStorageStatsQuery): Promise<StorageStatsDto> {
    const rootPath = resolveWorkspacePath(query.workspacePath);

    // Calculate real disk sizes asynchronously in parallel
    const [dbSize, feedsSize, exportsSize, backupsSize, logsSize] = await Promise.all([
      calculateDirSizeBytesAsync(path.join(rootPath, 'database')),
      calculateDirSizeBytesAsync(path.join(rootPath, 'feeds')),
      calculateDirSizeBytesAsync(path.join(rootPath, 'exports')),
      calculateDirSizeBytesAsync(path.join(rootPath, 'backups')),
      calculateDirSizeBytesAsync(path.join(rootPath, 'logs')),
    ]);
    const totalSize = dbSize + feedsSize + exportsSize + backupsSize + logsSize;

    // Available disk space non-blocking
    let availableDiskSpaceBytes: number | undefined = undefined;
    try {
      if (typeof fs.promises.statfs === 'function' && fs.existsSync(rootPath)) {
        const statfs = await fs.promises.statfs(rootPath);
        availableDiskSpaceBytes = statfs.bavail * statfs.bsize;
      }
    } catch {
      // Fallback
    }

    return {
      databaseSizeBytes: dbSize,
      feedsSizeBytes: feedsSize,
      exportsSizeBytes: exportsSize,
      backupsSizeBytes: backupsSize,
      logsSizeBytes: logsSize,
      totalSizeBytes: totalSize,
      availableDiskSpaceBytes,
      productsCount: 0,
      suppliersCount: 0,
      feedsCount: 0,
    };
  }
}
