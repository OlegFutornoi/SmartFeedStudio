import { ICommand } from '@nestjs/cqrs';
import { MemberRole } from '@smartfeed/shared';

export class InviteMemberCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly requesterUserId: string,
    public readonly email: string,
    public readonly role: MemberRole = MemberRole.MEMBER,
  ) {}
}
