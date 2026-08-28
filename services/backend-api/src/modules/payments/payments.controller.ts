import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { WayForPayService } from './services/wayforpay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  Role,
  CreateCheckoutDto,
  WayForPayWebhookDto,
  PaymentProvider,
  PaymentStatus,
  UpdatePaymentSettingDto,
  CheckoutResponseDto,
  PaymentTransactionDto,
  PaymentSettingDto,
  PaymentStatsDto,
} from '@smartfeed/shared';
import { CreatePaymentInvoiceCommand } from './commands/create-payment-invoice.command';
import { HandleWayForPayWebhookCommand } from './commands/handle-wayforpay-webhook.command';
import { UpdatePaymentSettingsCommand } from './commands/update-payment-settings.command';
import { GetPaymentTransactionsQuery } from './queries/get-payment-transactions.query';
import { GetPaymentStatsQuery } from './queries/get-payment-stats.query';
import { GetPaymentSettingsQuery } from './queries/get-payment-settings.query';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
    private readonly wayforpayService: WayForPayService,
  ) {}

  /**
   * 1. Create Checkout Invoice for authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(
    @Request() req: any,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.commandBus.execute(
      new CreatePaymentInvoiceCommand(req.user.id, dto.planCode, dto.billingInterval),
    );
  }

  /**
   * 2. Public WayForPay Webhook endpoint for transaction status notifications.
   */
  @HttpCode(HttpStatus.OK)
  @Post('wayforpay/webhook')
  async handleWayForPayWebhook(@Body() payload: WayForPayWebhookDto) {
    return this.commandBus.execute(new HandleWayForPayWebhookCommand(payload));
  }

  /**
   * 2b. Test Simulation: Simulate WayForPay Webhook in Sandbox Mode with card details.
   */
  @UseGuards(JwtAuthGuard)
  @Post('simulate-sandbox-webhook')
  async simulateSandboxWebhook(
    @Request() req: any,
    @Body()
    body: {
      orderReference: string;
      status?: 'Approved' | 'Declined';
      reason?: string;
      cardPan?: string;
      cardType?: string;
      issuerBank?: string;
    },
  ) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { orderReference: body.orderReference },
    });
    if (!tx || tx.userId !== req.user.id) {
      throw new NotFoundException('Transaction not found or unauthorized');
    }

    const setting = await this.prisma.paymentSetting.findUnique({
      where: { provider: PaymentProvider.WAYFORPAY },
    });
    const merchantAccount = setting?.merchantAccount || 'test_merch_n1';
    const secretKey = setting?.merchantSecretKey || 'flk3409refn54t54t*FNJRET';

    const cleanedPan = (body.cardPan || '').replace(/\D/g, '');
    let finalStatus: 'Approved' | 'Declined' = body.status || 'Approved';
    let finalReason = body.reason;

    if (!body.status && cleanedPan) {
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
      body.cardPan,
      body.cardType,
      body.issuerBank,
    );

    return this.commandBus.execute(new HandleWayForPayWebhookCommand(payload));
  }

  /**
   * 3. Admin: Get all payment transactions with filters and pagination.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('transactions')
  async getTransactions(
    @Query('status') status?: PaymentStatus,
    @Query('provider') provider?: PaymentProvider,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ transactions: PaymentTransactionDto[]; total: number }> {
    return this.queryBus.execute(
      new GetPaymentTransactionsQuery({
        status,
        provider,
        search,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      }),
    );
  }

  /**
   * 4. User: Get own payment transaction history.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-transactions')
  async getMyTransactions(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ transactions: PaymentTransactionDto[]; total: number }> {
    return this.queryBus.execute(
      new GetPaymentTransactionsQuery({
        userId: req.user.id,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0,
      }),
    );
  }

  /**
   * 5. Admin: Get aggregated payment statistics & KPIs.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('stats')
  async getStats(): Promise<PaymentStatsDto> {
    return this.queryBus.execute(new GetPaymentStatsQuery());
  }

  /**
   * 6. Admin: Get all payment gateway settings.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('settings')
  async getSettings(): Promise<PaymentSettingDto[]> {
    return this.queryBus.execute(new GetPaymentSettingsQuery());
  }

  /**
   * 7. Admin: Update payment gateway settings.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch('settings/:provider')
  async updateSettings(
    @Param('provider') provider: PaymentProvider,
    @Body() dto: UpdatePaymentSettingDto,
  ): Promise<PaymentSettingDto> {
    return this.commandBus.execute(new UpdatePaymentSettingsCommand(provider, dto));
  }
}
