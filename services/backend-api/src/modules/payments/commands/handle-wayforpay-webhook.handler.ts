import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { HandleWayForPayWebhookCommand } from '@/modules/payments/commands/handle-wayforpay-webhook.command';
import { WayForPayService } from '@/modules/payments/services/wayforpay.service';
import { SelectTariffPlanCommand } from '@/modules/licenses/commands/select-tariff-plan.command';
import { PaymentProvider } from '@smartfeed/shared';

@CommandHandler(HandleWayForPayWebhookCommand)
export class HandleWayForPayWebhookHandler implements ICommandHandler<HandleWayForPayWebhookCommand> {
  private readonly logger = new Logger(HandleWayForPayWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wayforpayService: WayForPayService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: HandleWayForPayWebhookCommand): Promise<{
    orderReference: string;
    status: string;
    time: number;
    signature: string;
  }> {
    const { payload } = command;

    // 1. Fetch Gateway Secret Key
    const setting = await this.prisma.paymentSetting.findUnique({
      where: { provider: PaymentProvider.WAYFORPAY },
    });
    const secretKey =
      setting?.merchantSecretKey ||
      process.env.WAYFORPAY_MERCHANT_SECRET_KEY ||
      'flk3409refn54t54vk354gh5400ef001';

    // 2. Validate Signature
    const isValid = this.wayforpayService.verifyWebhookSignature(payload, secretKey);
    if (!isValid) {
      this.logger.warn(`Invalid signature for orderReference: ${payload.orderReference}`);
      throw new BadRequestException('Invalid WayForPay signature');
    }

    // 3. Find Transaction
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { orderReference: payload.orderReference },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for orderReference: ${payload.orderReference}`);
      throw new NotFoundException(`Transaction '${payload.orderReference}' not found`);
    }

    // 4. Process Status with Idempotency Guard
    const isApproved = payload.transactionStatus === 'Approved';

    if (transaction.status === 'APPROVED' && isApproved) {
      this.logger.log(
        `Transaction ${payload.orderReference} is already APPROVED. Returning idempotent accept response.`,
      );
      return this.wayforpayService.generateAcceptResponse(payload.orderReference, secretKey);
    }

    if (isApproved) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'APPROVED',
          providerPaymentId: payload.authCode || undefined,
          cardPan: payload.cardPan || undefined,
          cardType: payload.cardType || undefined,
          issuerBank: payload.issuerBankName || undefined,
          paymentMethod: payload.paymentSystem || undefined,
          metadata: payload as unknown as Prisma.InputJsonValue,
        },
      });

      // 5. Automatically provision / extend License for user
      const interval = transaction.billingInterval === 'YEARLY' ? 'yearly' : 'monthly';
      await this.commandBus.execute(
        new SelectTariffPlanCommand(transaction.userId, transaction.planCode, interval),
      );

      this.logger.log(
        `Successfully processed payment for order ${transaction.orderReference}, plan ${transaction.planCode} (${interval})`,
      );
    } else {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'DECLINED',
          failureReason: payload.reason || payload.transactionStatus,
          metadata: payload as unknown as Prisma.InputJsonValue,
        },
      });

      this.logger.warn(
        `Payment declined for order ${transaction.orderReference}: ${payload.reason || payload.transactionStatus}`,
      );
    }

    // 6. Return standard Accept response
    return this.wayforpayService.generateAcceptResponse(payload.orderReference, secretKey);
  }
}
