import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDefaultWorkspacePathQuery } from '@/modules/storage/queries/get-default-workspace-path.query';
import { resolveWorkspacePath } from '@/modules/storage/utils/workspace-utils';

@QueryHandler(GetDefaultWorkspacePathQuery)
export class GetDefaultWorkspacePathHandler implements IQueryHandler<GetDefaultWorkspacePathQuery> {
  async execute(): Promise<{ defaultPath: string }> {
    const defaultPath = resolveWorkspacePath();
    return { defaultPath };
  }
}
