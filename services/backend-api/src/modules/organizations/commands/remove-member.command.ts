import { ICommand } from '@nestjs/cqrs';

export class RemoveMemberCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly requesterUserId: string,
    public readonly memberIdToRemove: string,
  ) {}
}
