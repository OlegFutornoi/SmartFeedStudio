import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@/prisma/prisma.module';
import { PaymentsController } from '@/modules/payments/payments.controller';
import { WayForPayService } from '@/modules/payments/services/wayforpay.service';

// Command Handlers
import { CreatePaymentInvoiceHandler } from '@/modules/payments/commands/create-payment-invoice.handler';
import { HandleWayForPayWebhookHandler } from '@/modules/payments/commands/handle-wayforpay-webhook.handler';
import { UpdatePaymentSettingsHandler } from '@/modules/payments/commands/update-payment-settings.handler';
import { SimulateSandboxWebhookHandler } from '@/modules/payments/commands/simulate-sandbox-webhook.handler';

// Query Handlers
import { GetPaymentTransactionsHandler } from '@/modules/payments/queries/get-payment-transactions.handler';
import { GetPaymentStatsHandler } from '@/modules/payments/queries/get-payment-stats.handler';
import { GetPaymentSettingsHandler } from '@/modules/payments/queries/get-payment-settings.handler';

export const CommandHandlers = [
  CreatePaymentInvoiceHandler,
  HandleWayForPayWebhookHandler,
  UpdatePaymentSettingsHandler,
  SimulateSandboxWebhookHandler,
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
