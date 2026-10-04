import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetPaymentSettingsQuery } from '@/modules/payments/queries/get-payment-settings.query';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';

@QueryHandler(GetPaymentSettingsQuery)
export class GetPaymentSettingsHandler implements IQueryHandler<GetPaymentSettingsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PaymentSettingDto[]> {
    const settings = await this.prisma.paymentSetting.findMany({
      orderBy: { provider: 'asc' },
    });

    return settings.map((s) => ({
      id: s.id,
      provider: s.provider as PaymentProvider,
      isEnabled: s.isEnabled,
      isTestMode: s.isTestMode,
      merchantAccount: s.merchantAccount,
      merchantSecretKey: s.merchantSecretKey,
      merchantDomain: s.merchantDomain,
      serviceUrl: s.serviceUrl,
      returnUrl: s.returnUrl,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }
}
