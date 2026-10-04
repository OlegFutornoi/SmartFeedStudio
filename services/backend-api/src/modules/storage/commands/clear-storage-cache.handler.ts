import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClearStorageCacheCommand } from '@/modules/storage/commands/clear-storage-cache.command';
import { ClearStorageCacheResultDto } from '@smartfeed/shared';
import { clearCacheOnDisk } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(ClearStorageCacheCommand)
export class ClearStorageCacheHandler implements ICommandHandler<ClearStorageCacheCommand> {
  async execute(command: ClearStorageCacheCommand): Promise<ClearStorageCacheResultDto> {
    return clearCacheOnDisk(command.workspacePath);
  }
}
