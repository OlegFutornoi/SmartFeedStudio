import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InitWorkspaceCommand } from '@/modules/storage/commands/init-workspace.command';
import { WorkspaceInfoDto } from '@smartfeed/shared';
import { initWorkspaceOnDisk } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(InitWorkspaceCommand)
export class InitWorkspaceHandler implements ICommandHandler<InitWorkspaceCommand> {
  async execute(command: InitWorkspaceCommand): Promise<WorkspaceInfoDto> {
    return initWorkspaceOnDisk(command.workspacePath);
  }
}
