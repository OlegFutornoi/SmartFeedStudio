import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDefaultWorkspacePathQuery } from './get-default-workspace-path.query';
import { resolveWorkspacePath } from '../utils/workspace-utils';

@QueryHandler(GetDefaultWorkspacePathQuery)
export class GetDefaultWorkspacePathHandler implements IQueryHandler<GetDefaultWorkspacePathQuery> {
  async execute(): Promise<{ defaultPath: string }> {
    const defaultPath = resolveWorkspacePath();
    return { defaultPath };
  }
}
