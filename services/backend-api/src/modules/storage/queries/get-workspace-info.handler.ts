import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWorkspaceInfoQuery } from './get-workspace-info.query';
import { WorkspaceInfoDto } from '@smartfeed/shared';
import { readWorkspaceInfo } from '../utils/workspace-utils';

@QueryHandler(GetWorkspaceInfoQuery)
export class GetWorkspaceInfoHandler implements IQueryHandler<GetWorkspaceInfoQuery> {
  async execute(query: GetWorkspaceInfoQuery): Promise<WorkspaceInfoDto | null> {
    return readWorkspaceInfo(query.workspacePath);
  }
}
