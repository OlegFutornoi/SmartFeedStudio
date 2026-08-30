import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MigrateWorkspaceCommand } from './migrate-workspace.command';
import { WorkspaceInfoDto } from '@smartfeed/shared';
import { migrateWorkspaceOnDisk } from '../utils/workspace-utils';

@CommandHandler(MigrateWorkspaceCommand)
export class MigrateWorkspaceHandler implements ICommandHandler<MigrateWorkspaceCommand> {
  async execute(command: MigrateWorkspaceCommand): Promise<WorkspaceInfoDto> {
    return migrateWorkspaceOnDisk(command.currentPath, command.newPath, command.moveExistingData);
  }
}
