import { PrismaClient, PaymentProvider } from '@/generated/prisma/client';

export async function seedPaymentSettings(prisma: PrismaClient): Promise<void> {
  const defaultWayForPay = {
    provider: PaymentProvider.WAYFORPAY,
    isEnabled: true,
    isTestMode: true,
    merchantAccount: 'test_merch_n1',
    merchantSecretKey: 'flk3409refn54t54t*FNJRET',
    merchantDomain: 'www.market.ua',
    serviceUrl: 'http://localhost:4000/api/payments/wayforpay/webhook',
    returnUrl: 'http://localhost:1420/payment/result',
  };

  await prisma.paymentSetting.upsert({
    where: { provider: PaymentProvider.WAYFORPAY },
    update: defaultWayForPay,
    create: defaultWayForPay,
  });
}
