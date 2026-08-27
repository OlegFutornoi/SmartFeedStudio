import { ICommand } from '@nestjs/cqrs';

export class AcceptInvitationCommand implements ICommand {
  constructor(
    public readonly token: string,
    public readonly fullName?: string,
    public readonly password?: string,
    public readonly authenticatedUserId?: string,
  ) {}
}
