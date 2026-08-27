import { IQuery } from '@nestjs/cqrs';

export class GetOrganizationInvitationsQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly requesterUserId: string,
  ) {}
}
