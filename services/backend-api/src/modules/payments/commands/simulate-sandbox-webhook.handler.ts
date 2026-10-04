import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SimulateSandboxWebhookCommand } from '@/modules/payments/commands/simulate-sandbox-webhook.command';
import { HandleWayForPayWebhookCommand } from '@/modules/payments/commands/handle-wayforpay-webhook.command';
import { WayForPayService } from '@/modules/payments/services/wayforpay.service';
import { PaymentProvider } from '@smartfeed/shared';

@CommandHandler(SimulateSandboxWebhookCommand)
export class SimulateSandboxWebhookHandler implements ICommandHandler<SimulateSandboxWebhookCommand> {
  private readonly logger = new Logger(SimulateSandboxWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wayforpayService: WayForPayService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: SimulateSandboxWebhookCommand) {
    const { userId, dto } = command;

    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { orderReference: dto.orderReference },
    });
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException('Transaction not found or unauthorized');
    }

    const setting = await this.prisma.paymentSetting.findUnique({
      where: { provider: PaymentProvider.WAYFORPAY },
    });
    const merchantAccount = setting?.merchantAccount || 'test_merch_n1';
    const secretKey = setting?.merchantSecretKey || 'flk3409refn54t54t*FNJRET';

    const cleanedPan = (dto.cardPan || '').replace(/\D/g, '');
    let finalStatus: 'Approved' | 'Declined' = dto.status || 'Approved';
    let finalReason = dto.reason;

    if (!dto.status && cleanedPan) {
      if (cleanedPan.endsWith('0002')) {
        finalStatus = 'Declined';
        finalReason = 'Відхилено банком-емітентом (Do Not Honor)';
      } else if (cleanedPan.endsWith('0001')) {
        finalStatus = 'Declined';
        finalReason = 'Недостатньо коштів на картці (Insufficient Funds)';
      }
    }

    const payload = this.wayforpayService.createSimulatedWebhookPayload(
      merchantAccount,
      secretKey,
      tx.orderReference,
      Number(tx.amount),
      tx.currency,
      finalStatus,
      finalReason,
      dto.cardPan,
      dto.cardType,
      dto.issuerBank,
    );

    this.logger.log(
      `Executing simulated webhook for order ${tx.orderReference} with status: ${finalStatus}`,
    );

    return this.commandBus.execute(new HandleWayForPayWebhookCommand(payload));
  }
}
