import { IQuery } from '@nestjs/cqrs';

export class GetAdminLicensesQuery implements IQuery {
  constructor(
    public readonly search?: string,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {}
}
