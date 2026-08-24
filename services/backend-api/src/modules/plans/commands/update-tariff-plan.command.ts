import { ICommand } from '@nestjs/cqrs';
import { UpdateTariffPlanDto } from '../dto/update-tariff-plan.dto';

export class UpdateTariffPlanCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateTariffPlanDto,
  ) {}
}
