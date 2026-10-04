import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePaymentInvoiceCommand } from '@/modules/payments/commands/create-payment-invoice.command';
import { WayForPayService } from '@/modules/payments/services/wayforpay.service';
import { CheckoutResponseDto, PaymentProvider, PaymentInterval } from '@smartfeed/shared';

@CommandHandler(CreatePaymentInvoiceCommand)
export class CreatePaymentInvoiceHandler implements ICommandHandler<CreatePaymentInvoiceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wayforpayService: WayForPayService,
  ) {}

  async execute(command: CreatePaymentInvoiceCommand): Promise<CheckoutResponseDto> {
    const { userId, planCode, billingInterval } = command;

    // 1. Fetch User
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Fetch Tariff Plan
    const plan = await this.prisma.tariffPlan.findUnique({
      where: { code: planCode.toUpperCase() },
    });
    if (!plan) {
      throw new NotFoundException(`Tariff plan '${planCode}' not found`);
    }

    // 3. Resolve Amount
    const isYearly = billingInterval === 'yearly';
    const amount = isYearly
      ? Number(plan.priceYearly || Number(plan.priceMonthly) * 12)
      : Number(plan.priceMonthly);

    if (amount <= 0 && plan.code !== 'STARTER') {
      throw new BadRequestException('Plan price must be greater than 0');
    }

    // 4. Generate unique Order Reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderReference = `SF-INV-${dateStr}-${randomHex}`;

    // 5. Create PaymentTransaction record in database
    await this.prisma.paymentTransaction.create({
      data: {
        orderReference,
        userId,
        planCode: plan.code,
        billingInterval: isYearly ? PaymentInterval.YEARLY : PaymentInterval.MONTHLY,
        amount,
        currency: plan.currency || 'UAH',
        status: 'PENDING',
        provider: 'WAYFORPAY',
      },
    });

    // 6. Fetch Active Gateway Settings
    const setting = await this.prisma.paymentSetting.findUnique({
      where: { provider: PaymentProvider.WAYFORPAY },
    });

    const merchantAccount =
      setting?.merchantAccount || process.env.WAYFORPAY_MERCHANT_ACCOUNT || 'test_merch_n1';
    const merchantSecretKey =
      setting?.merchantSecretKey ||
      process.env.WAYFORPAY_MERCHANT_SECRET_KEY ||
      'flk3409refn54t54t*FNJRET';
    const merchantDomainName =
      merchantAccount === 'test_merch_n1'
        ? setting?.merchantDomain && setting.merchantDomain !== 'localhost'
          ? setting.merchantDomain
          : 'www.market.ua'
        : setting?.merchantDomain || process.env.WAYFORPAY_DOMAIN_NAME || 'www.market.ua';
    const serviceUrl =
      setting?.serviceUrl ||
      process.env.WAYFORPAY_SERVICE_URL ||
      'http://localhost:4000/api/payments/wayforpay/webhook';
    const returnUrl =
      setting?.returnUrl ||
      process.env.WAYFORPAY_RETURN_URL ||
      'http://localhost:1420/payment/result';

    const productName = [
      `Підписка SmartFeed Studio - Тариф ${plan.nameUk || plan.nameEn} (${isYearly ? '1 рік' : '1 місяць'})`,
    ];

    // 7. Calculate signature and return payload
    return this.wayforpayService.createCheckoutPayload({
      merchantAccount,
      merchantSecretKey,
      merchantDomainName,
      orderReference,
      orderDate: Math.floor(Date.now() / 1000),
      amount,
      currency: plan.currency || 'UAH',
      productName,
      productPrice: [amount],
      productCount: [1],
      clientEmail: user.email,
      clientName: user.fullName || undefined,
      serviceUrl,
      returnUrl,
    });
  }
}
