import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { WayForPayService } from './services/wayforpay.service';

// Command Handlers
import { CreatePaymentInvoiceHandler } from './commands/create-payment-invoice.handler';
import { HandleWayForPayWebhookHandler } from './commands/handle-wayforpay-webhook.handler';
import { UpdatePaymentSettingsHandler } from './commands/update-payment-settings.handler';

// Query Handlers
import { GetPaymentTransactionsHandler } from './queries/get-payment-transactions.handler';
import { GetPaymentStatsHandler } from './queries/get-payment-stats.handler';
import { GetPaymentSettingsHandler } from './queries/get-payment-settings.handler';

export const CommandHandlers = [
  CreatePaymentInvoiceHandler,
  HandleWayForPayWebhookHandler,
  UpdatePaymentSettingsHandler,
];

export const QueryHandlers = [
  GetPaymentTransactionsHandler,
  GetPaymentStatsHandler,
  GetPaymentSettingsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [PaymentsController],
  providers: [WayForPayService, ...CommandHandlers, ...QueryHandlers],
  exports: [WayForPayService],
})
export class PaymentsModule {}
