import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdatePaymentSettingsCommand } from '@/modules/payments/commands/update-payment-settings.command';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';
import { PaymentProvider as PrismaPaymentProvider } from '@/generated/prisma/enums';
import { encryptSecret, decryptSecret } from '@/common/utils/crypto.util';

@CommandHandler(UpdatePaymentSettingsCommand)
export class UpdatePaymentSettingsHandler implements ICommandHandler<UpdatePaymentSettingsCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdatePaymentSettingsCommand): Promise<PaymentSettingDto> {
    const { provider, dto } = command;
    const prismaProvider = provider as unknown as PrismaPaymentProvider;

    const isMaskedSecret = Boolean(dto.merchantSecretKey && dto.merchantSecretKey.includes('•'));
    const secretToSave =
      dto.merchantSecretKey && !isMaskedSecret ? encryptSecret(dto.merchantSecretKey) : undefined;

    const setting = await this.prisma.paymentSetting.upsert({
      where: { provider: prismaProvider },
      update: {
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.isTestMode !== undefined ? { isTestMode: dto.isTestMode } : {}),
        ...(dto.merchantAccount !== undefined ? { merchantAccount: dto.merchantAccount } : {}),
        ...(secretToSave !== undefined ? { merchantSecretKey: secretToSave } : {}),
        ...(dto.merchantDomain !== undefined ? { merchantDomain: dto.merchantDomain } : {}),
        ...(dto.serviceUrl !== undefined ? { serviceUrl: dto.serviceUrl } : {}),
        ...(dto.returnUrl !== undefined ? { returnUrl: dto.returnUrl } : {}),
      },
      create: {
        provider: prismaProvider,
        isEnabled: dto.isEnabled ?? true,
        isTestMode: dto.isTestMode ?? true,
        merchantAccount: dto.merchantAccount || 'test_merch_n1',
        merchantSecretKey: encryptSecret(dto.merchantSecretKey) || null,
        merchantDomain: dto.merchantDomain || 'localhost',
        serviceUrl: dto.serviceUrl || 'http://localhost:4000/api/payments/wayforpay/webhook',
        returnUrl: dto.returnUrl || 'http://localhost:1420/payment/result',
      },
    });

    const decrypted = decryptSecret(setting.merchantSecretKey);

    return {
      id: setting.id,
      provider: setting.provider as PaymentProvider,
      isEnabled: setting.isEnabled,
      isTestMode: setting.isTestMode,
      merchantAccount: setting.merchantAccount,
      merchantSecretKey: decrypted ? `••••••••${decrypted.slice(-4)}` : null,
      isSecretConfigured: Boolean(decrypted),
      merchantDomain: setting.merchantDomain,
      serviceUrl: setting.serviceUrl,
      returnUrl: setting.returnUrl,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
