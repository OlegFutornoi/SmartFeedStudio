import { ICommand } from '@nestjs/cqrs';
import { CreateTariffPlanDto } from '../dto/create-tariff-plan.dto';

export class CreateTariffPlanCommand implements ICommand {
  constructor(public readonly dto: CreateTariffPlanDto) {}
}
