'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreditCard, Settings, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';
import { WayForPaySettingsDialog } from '@/components/payments/WayForPaySettingsDialog';
import { PaymentSettingsHeader } from '@/components/payments/PaymentSettingsHeader';
import { PaymentGatewaysList } from '@/components/payments/PaymentGatewaysList';

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

  return (
    <div
      data-testid="payments-settings-page"
      className="flex flex-col gap-6 max-w-5xl animate-in fade-in duration-300"
    >
      <PaymentSettingsHeader isUk={isUk} isLoading={isLoading} onRefresh={fetchSettings} />

      {/* Main Active Gateway Card (WayForPay) */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          {isUk ? 'Основний платіжний провайдер' : 'Primary Payment Provider'}
        </h2>

        <Card
          data-testid="gateway-card-wayforpay"
          className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors"
        >
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">WayForPay (Україна)</CardTitle>
                    {wfpSetting?.isEnabled ? (
                      <Badge
                        variant="outline"
                        data-testid="wfp-status-badge"
                        className="bg-primary/10 text-primary border-primary/20 text-[10px] flex items-center gap-1 font-mono font-medium"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>{isUk ? 'Активний' : 'Active'}</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        data-testid="wfp-status-badge"
                        className="text-[10px] flex items-center gap-1"
                      >
                        <AlertCircle className="size-3" />
                        <span>{isUk ? 'Вимкнено' : 'Disabled'}</span>
                      </Badge>
                    )}
                    {wfpSetting?.isTestMode && (
                      <Badge
                        variant="secondary"
                        data-testid="wfp-testmode-badge"
                        className="text-[10px] font-mono border border-border"
                      >
                        TEST MODE (SANDBOX)
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {isUk
                      ? 'Оплата банківськими картками Visa / MasterCard, Apple Pay, Google Pay, Приват24, Monobank'
                      : 'Card processing via Visa / MasterCard, Apple Pay, Google Pay, Privat24, Monobank'}
                  </CardDescription>
                </div>
              </div>

              <Button
                data-testid="configure-wayforpay-btn"
                variant="outline"
                size="sm"
                onClick={handleOpenWfp}
                className="h-8 text-xs gap-1.5 shrink-0 self-start sm:self-center"
              >
                <Settings className="size-3.5" />
                <span>{isUk ? 'Налаштувати' : 'Configure'}</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0 border-t border-border/40 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">
                  {isUk ? 'Ідентифікатор мерчанта:' : 'Merchant Account ID:'}
                </span>
                <span
                  data-testid="wfp-merchant-account"
                  className="font-mono font-medium text-foreground mt-0.5 block truncate"
                >
                  {wfpSetting?.merchantAccount || (isUk ? 'Не налаштовано' : 'Not configured')}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">
                  {isUk ? 'Секретний ключ:' : 'Secret Key:'}
                </span>
                <span
                  data-testid="wfp-merchant-secret"
                  className="font-mono font-medium text-foreground mt-0.5 block truncate"
                >
                  {wfpSetting?.merchantSecretKey
                    ? '••••••••••••••••'
                    : isUk
                      ? 'Не встановлено'
                      : 'Not set'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">
                  {isUk ? 'Режим обробки:' : 'Processing Mode:'}
                </span>
                <span className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>
                    {wfpSetting?.isTestMode
                      ? isUk
                        ? 'Тестовий (Sandbox)'
                        : 'Sandbox'
                      : isUk
                        ? 'Продакшн (Бойові платежі)'
                        : 'Production (Live)'}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Future Gateways */}
      <PaymentGatewaysList isUk={isUk} />

      {/* Settings Modal */}
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
