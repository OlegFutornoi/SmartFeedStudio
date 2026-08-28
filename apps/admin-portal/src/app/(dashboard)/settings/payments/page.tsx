'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard,
  WalletCards,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
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
import { api } from '../../../../lib/api';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';
import { WayForPaySettingsDialog } from '../../../../components/payments/WayForPaySettingsDialog';

export default function PaymentsSettingsPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [settings, setSettings] = useState<PaymentSettingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSetting, setSelectedSetting] = useState<PaymentSettingDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchSettings = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const data = await api.getPaymentSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load payment settings', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const wfpSetting = settings.find((s) => s.provider === PaymentProvider.WAYFORPAY) || null;

  const handleOpenWfp = () => {
    setSelectedSetting(wfpSetting);
    setDialogOpen(true);
  };

  const handleSaved = (updated: PaymentSettingDto) => {
    setSettings((prev) => prev.map((s) => (s.provider === updated.provider ? updated : s)));
  };

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
    <div
      data-testid="payments-settings-page"
      className="flex flex-col gap-6 max-w-5xl animate-in fade-in duration-300"
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
              ? 'Підключення та конфігурація платіжного шлюзу WayForPay, тестового терміналу Sandbox та ключів мерчанта'
              : 'Configure WayForPay gateway, Sandbox test terminal credentials, and live production keys'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <span>{isUk ? 'Журнал транзакцій' : 'View Transactions'}</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSettings}
            disabled={isLoading}
            className="h-8 px-2 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
        <ShieldCheck className="size-5 shrink-0 text-primary" />
        <div className="flex-1">
          <span className="font-semibold text-primary">
            {isUk ? 'Шлюз WayForPay активний' : 'WayForPay Gateway Active'}
          </span>{' '}
          —{' '}
          {wfpSetting?.isTestMode ? (
            <span className="text-muted-foreground">
              {isUk
                ? 'працює на офіційному тестовому мерчанті `test_merch_n1`. Оплати симулюються без реальних списань.'
                : 'running in Sandbox test mode (`test_merch_n1`). Test payments simulate license provisioning without real charges.'}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {isUk
                ? 'працює в БОЙОВОМУ режимі (Live Production). Реальні платежі клієнтів автоматично продовжують ліцензію.'
                : 'running in LIVE production mode. Real customer charges automatically provision licenses.'}
            </span>
          )}
        </div>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. WayForPay Active Gateway Card */}
        <Card
          data-testid="gateway-card-wayforpay"
          className="border-primary/50 bg-card shadow-sm hover:border-primary transition-all flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>WayForPay</span>
                    {wfpSetting?.isEnabled ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="size-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {isUk
                      ? 'Оплата картками Visa, MasterCard, Apple Pay, Google Pay та Приват24'
                      : 'Visa, MasterCard, Apple Pay, Google Pay & Privat24 checkout'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant={wfpSetting?.isTestMode ? 'outline' : 'default'}
                  className={`text-[10px] uppercase font-semibold ${
                    wfpSetting?.isTestMode
                      ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {wfpSetting?.isTestMode
                    ? isUk
                      ? 'Тестовий (Sandbox)'
                      : 'Sandbox Test'
                    : isUk
                      ? 'Бойовий (Live)'
                      : 'Live'}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {wfpSetting?.merchantAccount || 'test_merch_n1'}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2 flex items-center justify-between border-t border-border/50 mt-3">
            <div className="text-[11px] text-muted-foreground font-mono">WAYFORPAY_GATEWAY</div>
            <Button
              variant="default"
              size="sm"
              data-testid="configure-wayforpay-btn"
              onClick={handleOpenWfp}
              className="h-8 text-xs gap-1.5"
            >
              <Settings className="size-3.5" />
              <span>{isUk ? 'Налаштувати' : 'Configure'}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Other Gateways */}
        {otherGateways.map((gw) => {
          const Icon = gw.icon;
          return (
            <Card
              key={gw.id}
              className="border-border/80 bg-card/60 backdrop-blur-sm shadow-sm hover:border-border transition-all flex flex-col justify-between opacity-80"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-muted-foreground">{gw.name}</CardTitle>
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
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Dialog */}
      <WayForPaySettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        setting={selectedSetting}
        onSaved={handleSaved}
        isUk={isUk}
      />
    </div>
  );
}
