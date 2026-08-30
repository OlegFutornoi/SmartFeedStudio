import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStorageStatsQuery } from './get-storage-stats.query';
import { StorageStatsDto } from '@smartfeed/shared';
import { calculateDirSizeBytes, resolveWorkspacePath } from '../utils/workspace-utils';
import * as path from 'path';
import * as fs from 'fs';

@QueryHandler(GetStorageStatsQuery)
export class GetStorageStatsHandler implements IQueryHandler<GetStorageStatsQuery> {
  async execute(query: GetStorageStatsQuery): Promise<StorageStatsDto> {
    const rootPath = resolveWorkspacePath(query.workspacePath);

    // Calculate real disk sizes
    const dbSize = calculateDirSizeBytes(path.join(rootPath, 'database'));
    const feedsSize = calculateDirSizeBytes(path.join(rootPath, 'feeds'));
    const exportsSize = calculateDirSizeBytes(path.join(rootPath, 'exports'));
    const backupsSize = calculateDirSizeBytes(path.join(rootPath, 'backups'));
    const logsSize = calculateDirSizeBytes(path.join(rootPath, 'logs'));
    const totalSize = dbSize + feedsSize + exportsSize + backupsSize + logsSize;

    // Available disk space
    let availableDiskSpaceBytes: number | undefined = undefined;
    try {
      if (typeof fs.statfsSync === 'function' && fs.existsSync(rootPath)) {
        const statfs = fs.statfsSync(rootPath);
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
