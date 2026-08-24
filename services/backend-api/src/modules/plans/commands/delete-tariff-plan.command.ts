import { ICommand } from '@nestjs/cqrs';

export class DeleteTariffPlanCommand implements ICommand {
  constructor(public readonly id: string) {}
}
