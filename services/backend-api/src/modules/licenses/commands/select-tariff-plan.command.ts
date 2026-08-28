import { BillingInterval } from '@smartfeed/shared';

export class SelectTariffPlanCommand {
  constructor(
    public readonly userId: string,
    public readonly planCode: string,
    public readonly billingInterval: BillingInterval = 'monthly',
  ) {}
}
