import { ICommand } from '@nestjs/cqrs';

export class CreatePaymentInvoiceCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly planCode: string,
    public readonly billingInterval: 'monthly' | 'yearly' = 'monthly',
  ) {}
}
