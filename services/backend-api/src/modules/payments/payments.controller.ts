import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CheckoutResponseDto,
  PaymentProvider,
  PaymentSettingDto,
  PaymentStatsDto,
  PaymentStatus,
  PaymentTransactionDto,
  Role,
  UpdatePaymentSettingDto,
  WayForPayWebhookDto,
} from '@smartfeed/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePaymentInvoiceCommand } from './commands/create-payment-invoice.command';
import { HandleWayForPayWebhookCommand } from './commands/handle-wayforpay-webhook.command';
import { SimulateSandboxWebhookCommand } from './commands/simulate-sandbox-webhook.command';
import { UpdatePaymentSettingsCommand } from './commands/update-payment-settings.command';
import { GetPaymentTransactionsQuery } from './queries/get-payment-transactions.query';
import { GetPaymentStatsQuery } from './queries/get-payment-stats.query';
import { GetPaymentSettingsQuery } from './queries/get-payment-settings.query';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SimulateSandboxWebhookDto } from './dto/simulate-sandbox-webhook.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 1. Create Checkout Invoice for authenticated user.
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.commandBus.execute(
      new CreatePaymentInvoiceCommand(userId, dto.planCode, dto.billingInterval),
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
    @CurrentUser('id') userId: string,
    @Body() body: SimulateSandboxWebhookDto,
  ) {
    return this.commandBus.execute(new SimulateSandboxWebhookCommand(userId, body));
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
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ transactions: PaymentTransactionDto[]; total: number }> {
    return this.queryBus.execute(
      new GetPaymentTransactionsQuery({
        userId,
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
