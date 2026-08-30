'use client';

import React from 'react';
import { CreditCard, WalletCards, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentGatewaysListProps {
  isUk: boolean;
}

export const PaymentGatewaysList: React.FC<PaymentGatewaysListProps> = ({ isUk }) => {
  const otherGateways = [
    {
      id: 'stripe',
      name: 'Stripe Payments',
      descUk: 'Міжнародний процесинг кредитних карток (Visa, MasterCard, Apple Pay, Google Pay)',
      descEn: 'Global credit card processing (Visa, MasterCard, Apple Pay, Google Pay)',
      statusUk: 'Скоро',
      statusEn: 'Coming Soon',
      badgeVariant: 'secondary' as const,
      icon: CreditCard,
    },
    {
      id: 'liqpay',
      name: 'LiqPay / Privat24',
      descUk: 'Миттєва оплата через українські банківські додатки та QR-коди',
      descEn: 'Instant checkout through Ukrainian banking apps and QR payments',
      statusUk: 'Скоро',
      statusEn: 'Coming Soon',
      badgeVariant: 'secondary' as const,
      icon: WalletCards,
    },
    {
      id: 'crypto',
      name: 'Crypto Checkout (USDT / BTC)',
      descUk: 'Автоматизований прийом платежів у стейблкоїнах (TRC-20, ERC-20)',
      descEn: 'Automated crypto invoicing and payment processing in stablecoins',
      statusUk: 'В розробці',
      statusEn: 'In Development',
      badgeVariant: 'outline' as const,
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground tracking-tight">
        {isUk ? 'Додаткові платіжні шлюзи' : 'Additional Payment Gateways'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {otherGateways.map((gw) => {
          const Icon = gw.icon;
          return (
            <Card
              key={gw.id}
              className="border-border bg-card/60 opacity-80 hover:opacity-100 transition-opacity"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <Badge variant={gw.badgeVariant} className="text-[10px]">
                    {isUk ? gw.statusUk : gw.statusEn}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold mt-2">{gw.name}</CardTitle>
                <CardDescription className="text-xs">
                  {isUk ? gw.descUk : gw.descEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-[11px] text-muted-foreground italic">
                  {isUk
                    ? 'Буде доступно в наступних релізах'
                    : 'Will be available in future releases'}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
