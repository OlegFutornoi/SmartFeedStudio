import { IQuery } from '@nestjs/cqrs';

export class GetLicenseByUserIdQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
