'use client';

import React from 'react';
import {
  CreditCard,
  WalletCards,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function PaymentsSettingsPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const gateways = [
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
      id: 'wayforpay',
      name: 'WayForPay',
      descUk: 'Популярний платіжний агрегатор для e-commerce в Україні з регулярними платежами',
      descEn: 'Leading e-commerce payment aggregator in Ukraine with recurring subscriptions',
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
    <div
      data-testid="payments-settings-page"
      className="flex flex-col gap-8 max-w-5xl animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/settings"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>{isUk ? 'Налаштування' : 'Settings'}</span>
            </Link>
          </div>
          <h1
            data-testid="payments-header-title"
            className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5"
          >
            <WalletCards className="size-6 text-primary" />
            <span>{isUk ? 'Платіжні системи' : 'Payment Gateways'}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isUk
              ? 'Підключення платіжних шлюзів, рекурентних підписок та автоматичного виставлення рахунків'
              : 'Configure payment processors, recurring subscription billing, and automated invoicing'}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs">
        <ShieldAlert className="size-5 shrink-0" />
        <div>
          <span className="font-semibold">
            {isUk
              ? 'Модуль монетизації знаходиться на етапі тестування.'
              : 'Billing module is currently under staging tests.'}
          </span>{' '}
          {isUk
            ? 'Підключення вебхуків та бойових ключів мерчантів стане доступним у наступному оновленні релізу.'
            : 'Live webhooks and merchant API keys integration will become active in the upcoming release update.'}
        </div>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gateways.map((gw) => {
          const Icon = gw.icon;
          return (
            <Card
              key={gw.id}
              className="border-border/80 bg-card/60 backdrop-blur-sm shadow-sm hover:border-border transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{gw.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {isUk ? gw.descUk : gw.descEn}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={gw.badgeVariant} className="text-[10px] uppercase font-semibold">
                    {isUk ? gw.statusUk : gw.statusEn}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-2 flex items-center justify-between border-t border-border/50 mt-4">
                <div className="text-[11px] text-muted-foreground font-mono">
                  {gw.id.toUpperCase()}_GATEWAY
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-7 text-xs gap-1.5 opacity-60"
                >
                  <span>{isUk ? 'Налаштувати' : 'Configure'}</span>
                  <ExternalLink className="size-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
