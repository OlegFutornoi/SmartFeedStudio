import { PrismaClient } from '@/generated/prisma/client';

export const defaultBankProvidersSeedData = [
  {
    bankId: 'nbu',
    bankName: 'НБУ',
    badge: 'НБУ',
    logoUrl: '/logos/banks/nbu.svg',
    isEnabled: true,
    isDefault: true,
    sourceType: 'API_DIRECT',
    sellSpreadPercent: 0,
    buySpreadPercent: 0,
    sortOrder: 1,
  },
  {
    bankId: 'privat',
    bankName: 'ПриватБанк',
    badge: 'ПБ',
    logoUrl: '/logos/banks/privat.svg',
    isEnabled: true,
    isDefault: false,
    sourceType: 'API_DIRECT',
    sellSpreadPercent: 1.0,
    buySpreadPercent: -0.6,
    sortOrder: 2,
  },
  {
    bankId: 'mono',
    bankName: 'Monobank',
    badge: 'MONO',
    logoUrl: '/logos/banks/mono.svg',
    isEnabled: true,
    isDefault: false,
    sourceType: 'API_DIRECT',
    sellSpreadPercent: 0.9,
    buySpreadPercent: -0.5,
    sortOrder: 3,
  },
  {
    bankId: 'raiffeisen',
    bankName: 'Райффайзен',
    badge: 'РАЙФ',
    logoUrl: '/logos/banks/raiffeisen.svg',
    isEnabled: true,
    isDefault: false,
    sourceType: 'COMMERCIAL_SPREAD',
    sellSpreadPercent: 1.2,
    buySpreadPercent: -0.7,
    sortOrder: 4,
  },
  {
    bankId: 'pumb',
    bankName: 'ПУМБ',
    badge: 'ПУМБ',
    logoUrl: '/logos/banks/pumb.svg',
    isEnabled: true,
    isDefault: false,
    sourceType: 'COMMERCIAL_SPREAD',
    sellSpreadPercent: 1.1,
    buySpreadPercent: -0.5,
    sortOrder: 5,
  },
];

export async function seedBankProviders(prisma: PrismaClient): Promise<void> {
  for (const provider of defaultBankProvidersSeedData) {
    await prisma.bankCurrencyProvider.upsert({
      where: { bankId: provider.bankId },
      update: {
        bankName: provider.bankName,
        badge: provider.badge,
        logoUrl: provider.logoUrl,
        sortOrder: provider.sortOrder,
      },
      create: provider,
    });
  }
}
