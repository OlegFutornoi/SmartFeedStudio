import { IQuery } from '@nestjs/cqrs';

export class GetInvitationByTokenQuery implements IQuery {
  constructor(public readonly token: string) {}
}
