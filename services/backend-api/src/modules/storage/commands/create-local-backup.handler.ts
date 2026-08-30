import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLocalBackupCommand } from './create-local-backup.command';
import { CreateLocalBackupResultDto } from '@smartfeed/shared';
import { createBackupFileOnDisk } from '../utils/workspace-utils';

@CommandHandler(CreateLocalBackupCommand)
export class CreateLocalBackupHandler implements ICommandHandler<CreateLocalBackupCommand> {
  async execute(command: CreateLocalBackupCommand): Promise<CreateLocalBackupResultDto> {
    return createBackupFileOnDisk(command.workspacePath);
  }
}
