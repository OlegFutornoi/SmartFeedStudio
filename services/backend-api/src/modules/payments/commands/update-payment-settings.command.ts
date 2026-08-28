import { ICommand } from '@nestjs/cqrs';
import { PaymentProvider, UpdatePaymentSettingDto } from '@smartfeed/shared';

export class UpdatePaymentSettingsCommand implements ICommand {
  constructor(
    public readonly provider: PaymentProvider,
    public readonly dto: UpdatePaymentSettingDto,
  ) {}
}
