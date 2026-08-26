import { IQuery } from '@nestjs/cqrs';

export class GetOrganizationMembersQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly userId: string,
  ) {}
}
