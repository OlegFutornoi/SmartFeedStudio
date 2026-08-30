import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClearStorageCacheCommand } from './clear-storage-cache.command';
import { ClearStorageCacheResultDto } from '@smartfeed/shared';
import { clearCacheOnDisk } from '../utils/workspace-utils';

@CommandHandler(ClearStorageCacheCommand)
export class ClearStorageCacheHandler implements ICommandHandler<ClearStorageCacheCommand> {
  async execute(command: ClearStorageCacheCommand): Promise<ClearStorageCacheResultDto> {
    return clearCacheOnDisk(command.workspacePath);
  }
}
