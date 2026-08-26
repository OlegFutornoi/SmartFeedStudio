import { IQuery } from '@nestjs/cqrs';

export class GetUserOrganizationsQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
