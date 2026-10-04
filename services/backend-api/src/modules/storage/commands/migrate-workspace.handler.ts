import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MigrateWorkspaceCommand } from '@/modules/storage/commands/migrate-workspace.command';
import { WorkspaceInfoDto } from '@smartfeed/shared';
import { migrateWorkspaceOnDisk } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(MigrateWorkspaceCommand)
export class MigrateWorkspaceHandler implements ICommandHandler<MigrateWorkspaceCommand> {
  async execute(command: MigrateWorkspaceCommand): Promise<WorkspaceInfoDto> {
    return migrateWorkspaceOnDisk(command.currentPath, command.newPath, command.moveExistingData);
  }
}
