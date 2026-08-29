'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { PaymentSettingDto, PaymentProvider } from '@smartfeed/shared';
import { api } from '../../lib/api';
import { KeyRound, Globe, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface WayForPaySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: PaymentSettingDto | null;
  onSaved: (updated: PaymentSettingDto) => void;
  isUk: boolean;
}

export function WayForPaySettingsDialog({
  open,
  onOpenChange,
  setting,
  onSaved,
  isUk,
}: WayForPaySettingsDialogProps) {
  const [merchantAccount, setMerchantAccount] = useState('');
  const [merchantSecretKey, setMerchantSecretKey] = useState('');
  const [merchantDomain, setMerchantDomain] = useState('');
  const [isTestMode, setIsTestMode] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (setting) {
      setMerchantAccount(setting.merchantAccount || 'test_merch_n1');
      setMerchantSecretKey(setting.merchantSecretKey || 'flk3409refn54t54vk354gh5400ef001');
      setMerchantDomain(setting.merchantDomain || 'localhost');
      setIsTestMode(setting.isTestMode ?? true);
      setIsEnabled(setting.isEnabled ?? true);
      setError(null);
      setSuccess(false);
    }
  }, [setting, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      setIsSaving(true);
      const updated = await api.updatePaymentSetting(PaymentProvider.WAYFORPAY, {
        merchantAccount: merchantAccount.trim(),
        merchantSecretKey: merchantSecretKey.trim(),
        merchantDomain: merchantDomain.trim(),
        isTestMode,
        isEnabled,
      });

      setSuccess(true);
      onSaved(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isUk ? 'Налаштування WayForPay' : 'WayForPay Settings'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isUk
                  ? 'Конфігурація ключів API, тестового режиму Sandbox та домену мерчанта'
                  : 'Configure API keys, Sandbox test mode, and merchant domain'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{isUk ? 'Налаштування успішно збережено!' : 'Settings saved successfully!'}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 py-1">
          {/* Status Switches */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/70 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label htmlFor="wfp-active-switch" className="text-xs font-medium cursor-pointer">
                {isUk ? 'Шлюз активний' : 'Gateway Active'}
              </Label>
              <Switch
                id="wfp-active-switch"
                data-testid="wfp-active-switch"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="wfp-sandbox-switch" className="text-xs font-medium cursor-pointer">
                  {isUk ? 'Тестовий режим' : 'Sandbox Mode'}
                </Label>
                <div className="text-[10px] text-muted-foreground">
                  {isTestMode
                    ? isUk
                      ? 'Без списань'
                      : 'No real charges'
                    : isUk
                      ? 'Реальні гроші'
                      : 'Live processing'}
                </div>
              </div>
              <Switch
                id="wfp-sandbox-switch"
                data-testid="wfp-sandbox-switch"
                checked={isTestMode}
                onCheckedChange={setIsTestMode}
              />
            </div>
          </div>

          {/* Merchant Account */}
          <div className="space-y-1.5">
            <Label htmlFor="merchantAccount" className="text-xs">
              {isUk ? 'Merchant Account (Ідентифікатор мерчанта)' : 'Merchant Account ID'}
            </Label>
            <div className="relative">
              <Input
                id="merchantAccount"
                data-testid="merchant-account-input"
                value={merchantAccount}
                onChange={(e) => setMerchantAccount(e.target.value)}
                placeholder="test_merch_n1"
                className="h-9 text-xs pl-8 font-mono"
                required
              />
              <KeyRound className="size-3.5 absolute left-2.5 top-3 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isUk
                ? 'Для тесту використовуйте `test_merch_n1`. Для бойового введіть ID з кабінету WayForPay.'
                : 'Use `test_merch_n1` for sandbox. Enter your live ID for production.'}
            </p>
          </div>

          {/* Merchant Secret Key */}
          <div className="space-y-1.5">
            <Label htmlFor="merchantSecretKey" className="text-xs">
              {isUk ? 'Merchant Secret Key (Секретний ключ підпису)' : 'Merchant Secret Key'}
            </Label>
            <div className="relative">
              <Input
                id="merchantSecretKey"
                data-testid="merchant-secret-key-input"
                value={merchantSecretKey}
                onChange={(e) => setMerchantSecretKey(e.target.value)}
                placeholder="flk3409refn54t54t*FNJRET"
                className="h-9 text-xs pl-8 font-mono"
                required
              />
              <Shield className="size-3.5 absolute left-2.5 top-3 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isUk
                ? "Для тесту: 'flk3409refn54t54t*FNJRET'. Для бойового — Secret Key з кабінету WayForPay."
                : "For testing: 'flk3409refn54t54t*FNJRET'. For live — Secret Key from WayForPay account."}
            </p>
          </div>

          {/* Merchant Domain */}
          <div className="space-y-1.5">
            <Label htmlFor="merchantDomain" className="text-xs">
              {isUk ? 'Домен сайту (Domain Name)' : 'Registered Domain Name'}
            </Label>
            <div className="relative">
              <Input
                id="merchantDomain"
                data-testid="merchant-domain-input"
                value={merchantDomain}
                onChange={(e) => setMerchantDomain(e.target.value)}
                placeholder="www.market.ua"
                className="h-9 text-xs pl-8 font-mono"
                required
              />
              <Globe className="size-3.5 absolute left-2.5 top-3 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isUk
                ? "Для тесту вкажіть 'www.market.ua' (домен тестового мерчанта WayForPay). Для бойового — зареєстрований домен вашого сайту (напр. smartfeed.studio)."
                : "For test mode enter 'www.market.ua' (WayForPay test domain). For production — your registered store domain."}
            </p>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs"
            >
              {isUk ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="sm"
              data-testid="save-wfp-settings-btn"
              disabled={isSaving}
              className="text-xs gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{isUk ? 'Збереження...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>{isUk ? 'Зберегти зміни' : 'Save Changes'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
