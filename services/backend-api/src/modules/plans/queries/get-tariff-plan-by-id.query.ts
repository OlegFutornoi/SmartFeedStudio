import { IQuery } from '@nestjs/cqrs';

export class GetTariffPlanByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
