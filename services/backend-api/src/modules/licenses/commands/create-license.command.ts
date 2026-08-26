import { ICommand } from '@nestjs/cqrs';
import { PlanType } from '@smartfeed/shared';

export class CreateLicenseCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly planType: PlanType = PlanType.STARTER,
    public readonly expiresAt?: Date,
  ) {}
}
