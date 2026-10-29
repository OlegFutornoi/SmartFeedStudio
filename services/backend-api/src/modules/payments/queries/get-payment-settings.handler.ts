import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetPaymentSettingsQuery } from '@/modules/payments/queries/get-payment-settings.query';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';
import { decryptSecret } from '@/common/utils/crypto.util';

@QueryHandler(GetPaymentSettingsQuery)
export class GetPaymentSettingsHandler implements IQueryHandler<GetPaymentSettingsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PaymentSettingDto[]> {
    const settings = await this.prisma.paymentSetting.findMany({
      orderBy: { provider: 'asc' },
    });

    return settings.map((s) => {
      const decrypted = decryptSecret(s.merchantSecretKey);
      return {
        id: s.id,
        provider: s.provider as PaymentProvider,
        isEnabled: s.isEnabled,
        isTestMode: s.isTestMode,
        merchantAccount: s.merchantAccount,
        merchantSecretKey: decrypted ? `••••••••${decrypted.slice(-4)}` : null,
        isSecretConfigured: Boolean(decrypted),
        merchantDomain: s.merchantDomain,
        serviceUrl: s.serviceUrl,
        returnUrl: s.returnUrl,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });
  }
}
