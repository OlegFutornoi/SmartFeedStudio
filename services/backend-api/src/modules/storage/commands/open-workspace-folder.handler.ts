import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OpenWorkspaceFolderCommand } from '@/modules/storage/commands/open-workspace-folder.command';
import { openInOsFileManager } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(OpenWorkspaceFolderCommand)
export class OpenWorkspaceFolderHandler implements ICommandHandler<OpenWorkspaceFolderCommand> {
  async execute(command: OpenWorkspaceFolderCommand): Promise<{ success: boolean }> {
    openInOsFileManager(command.path);
    return { success: true };
  }
}
