import { ICommand } from '@nestjs/cqrs';

export class RevokeInvitationCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly requesterUserId: string,
    public readonly invitationId: string,
  ) {}
}
