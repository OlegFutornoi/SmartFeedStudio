import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdatePaymentSettingsCommand } from './update-payment-settings.command';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';

@CommandHandler(UpdatePaymentSettingsCommand)
export class UpdatePaymentSettingsHandler implements ICommandHandler<UpdatePaymentSettingsCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdatePaymentSettingsCommand): Promise<PaymentSettingDto> {
    const { provider, dto } = command;

    const setting = await this.prisma.paymentSetting.upsert({
      where: { provider: provider as any },
      update: {
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.isTestMode !== undefined ? { isTestMode: dto.isTestMode } : {}),
        ...(dto.merchantAccount !== undefined ? { merchantAccount: dto.merchantAccount } : {}),
        ...(dto.merchantSecretKey !== undefined
          ? { merchantSecretKey: dto.merchantSecretKey }
          : {}),
        ...(dto.merchantDomain !== undefined ? { merchantDomain: dto.merchantDomain } : {}),
        ...(dto.serviceUrl !== undefined ? { serviceUrl: dto.serviceUrl } : {}),
        ...(dto.returnUrl !== undefined ? { returnUrl: dto.returnUrl } : {}),
      },
      create: {
        provider: provider as any,
        isEnabled: dto.isEnabled ?? true,
        isTestMode: dto.isTestMode ?? true,
        merchantAccount: dto.merchantAccount || 'test_merch_n1',
        merchantSecretKey: dto.merchantSecretKey || 'flk3409refn54t54vk354gh5400ef001',
        merchantDomain: dto.merchantDomain || 'localhost',
        serviceUrl: dto.serviceUrl || 'http://localhost:4000/api/payments/wayforpay/webhook',
        returnUrl: dto.returnUrl || 'http://localhost:1420/payment/result',
      },
    });

    return {
      id: setting.id,
      provider: setting.provider as PaymentProvider,
      isEnabled: setting.isEnabled,
      isTestMode: setting.isTestMode,
      merchantAccount: setting.merchantAccount,
      merchantSecretKey: setting.merchantSecretKey,
      merchantDomain: setting.merchantDomain,
      serviceUrl: setting.serviceUrl,
      returnUrl: setting.returnUrl,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
