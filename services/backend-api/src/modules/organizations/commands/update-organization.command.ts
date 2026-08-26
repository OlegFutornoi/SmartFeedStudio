import { ICommand } from '@nestjs/cqrs';

export class UpdateOrganizationCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly requesterUserId: string,
    public readonly name: string,
  ) {}
}
