import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SelectWorkspaceFolderCommand } from '@/modules/storage/commands/select-workspace-folder.command';
import { selectFolderDialog } from '@/modules/storage/utils/workspace-utils';

@CommandHandler(SelectWorkspaceFolderCommand)
export class SelectWorkspaceFolderHandler implements ICommandHandler<SelectWorkspaceFolderCommand> {
  async execute(): Promise<{ path: string | null }> {
    const path = await selectFolderDialog();
    return { path };
  }
}
