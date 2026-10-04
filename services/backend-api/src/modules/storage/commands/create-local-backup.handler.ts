import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLocalBackupCommand } from '@/modules/storage/commands/create-local-backup.command';
import { CreateLocalBackupResultDto } from '@smartfeed/shared';
import { createBackupFileOnDisk } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(CreateLocalBackupCommand)
export class CreateLocalBackupHandler implements ICommandHandler<CreateLocalBackupCommand> {
  async execute(command: CreateLocalBackupCommand): Promise<CreateLocalBackupResultDto> {
    return createBackupFileOnDisk(command.workspacePath);
  }
}
