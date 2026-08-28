import { IQuery } from '@nestjs/cqrs';
import { PaymentStatus, PaymentProvider } from '@smartfeed/shared';

export class GetPaymentTransactionsQuery implements IQuery {
  constructor(
    public readonly options: {
      userId?: string;
      status?: PaymentStatus;
      provider?: PaymentProvider;
      search?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {}
}
