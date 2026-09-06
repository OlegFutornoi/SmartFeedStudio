import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SelectWorkspaceFolderCommand } from './select-workspace-folder.command';
import { selectFolderDialog } from '../utils/workspace-utils';

@CommandHandler(SelectWorkspaceFolderCommand)
export class SelectWorkspaceFolderHandler implements ICommandHandler<SelectWorkspaceFolderCommand> {
  async execute(): Promise<{ path: string | null }> {
    const path = await selectFolderDialog();
    return { path };
  }
}
